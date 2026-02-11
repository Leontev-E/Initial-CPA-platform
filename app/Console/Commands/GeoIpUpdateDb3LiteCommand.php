<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;
use ZipArchive;

class GeoIpUpdateDb3LiteCommand extends Command
{
    protected $signature = 'geoip:update-db3-lite
        {--force : Ignore conditional HTTP headers and force re-download}
        {--url= : Override download URL}
        {--target= : Override target BIN path}';

    protected $description = 'Download and refresh IP2Location DB3 Lite BIN database';

    public function handle(): int
    {
        if (! (bool) config('geoip.auto_update.enabled', true) && ! $this->option('force')) {
            $this->warn('GeoIP auto update is disabled (GEOIP_AUTO_UPDATE_ENABLED=false).');

            return self::SUCCESS;
        }

        $url = (string) ($this->option('url') ?: config('geoip.auto_update.url'));
        $targetPath = (string) ($this->option('target') ?: config('geoip.ip2location.database_path'));

        if ($url === '' || $targetPath === '') {
            $this->error('Invalid configuration: URL and target path are required.');

            return self::FAILURE;
        }

        $targetDir = dirname($targetPath);
        File::ensureDirectoryExists($targetDir);

        $metaPath = $targetDir.'/ip2location-db3-lite.meta.json';
        $meta = $this->readMeta($metaPath);

        $headers = ['Accept' => 'application/zip, application/octet-stream'];
        if (! $this->option('force')) {
            if (! empty($meta['etag'])) {
                $headers['If-None-Match'] = (string) $meta['etag'];
            }
            if (! empty($meta['last_modified'])) {
                $headers['If-Modified-Since'] = (string) $meta['last_modified'];
            }
        }

        $tmpDir = storage_path('app/ip2location/tmp/'.Str::uuid()->toString());
        File::ensureDirectoryExists($tmpDir);
        $zipPath = $tmpDir.'/db3-lite.zip';

        try {
            $response = Http::withHeaders($headers)
                ->connectTimeout((int) config('geoip.auto_update.connect_timeout', 10))
                ->timeout((int) config('geoip.auto_update.timeout', 120))
                ->sink($zipPath)
                ->get($url);

            if ($response->status() === 304) {
                $this->info('DB3 Lite is up to date (304 Not Modified).');
                $this->cleanup($tmpDir);

                return self::SUCCESS;
            }

            if (! $response->successful()) {
                $this->error(sprintf('Download failed: HTTP %d', $response->status()));
                $this->cleanup($tmpDir);

                return self::FAILURE;
            }

            $sourceBin = $this->extractBinFromZip($zipPath, $tmpDir.'/extract');
            if (! $sourceBin) {
                $this->error('Could not find .BIN file in downloaded archive.');
                $this->cleanup($tmpDir);

                return self::FAILURE;
            }

            $this->replaceFile($sourceBin, $targetPath);

            $newMeta = [
                'updated_at' => now()->toIso8601String(),
                'source_url' => $url,
                'etag' => $response->header('ETag'),
                'last_modified' => $response->header('Last-Modified'),
                'sha256' => hash_file('sha256', $targetPath),
                'size' => filesize($targetPath) ?: null,
            ];
            File::put($metaPath, json_encode($newMeta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            $this->info(sprintf('DB3 Lite updated: %s', $targetPath));
            $this->cleanup($tmpDir);

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error('DB3 update failed: '.$exception->getMessage());
            $this->cleanup($tmpDir);

            return self::FAILURE;
        }
    }

    private function readMeta(string $path): array
    {
        if (! File::exists($path)) {
            return [];
        }

        $decoded = json_decode((string) File::get($path), true);

        return is_array($decoded) ? $decoded : [];
    }

    private function extractBinFromZip(string $zipPath, string $extractDir): ?string
    {
        if (! File::exists($zipPath) || (filesize($zipPath) ?: 0) === 0) {
            return null;
        }

        $zip = new ZipArchive();
        $opened = $zip->open($zipPath);
        if ($opened !== true) {
            return null;
        }

        File::ensureDirectoryExists($extractDir);

        $binCandidates = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = (string) $zip->getNameIndex($i);
            if (str_ends_with(strtoupper($name), '.BIN')) {
                $binCandidates[] = $name;
            }
        }

        if ($binCandidates === []) {
            $zip->close();

            return null;
        }

        $targetEntry = collect($binCandidates)
            ->sortByDesc(fn (string $name) => str_contains(strtoupper($name), 'DB3'))
            ->first();

        $zip->extractTo($extractDir, [$targetEntry]);
        $zip->close();

        $directPath = $extractDir.DIRECTORY_SEPARATOR.$targetEntry;
        if (File::exists($directPath)) {
            return $directPath;
        }

        $allBins = File::allFiles($extractDir);
        foreach ($allBins as $file) {
            if (str_ends_with(strtoupper($file->getFilename()), '.BIN')) {
                return $file->getPathname();
            }
        }

        return null;
    }

    private function replaceFile(string $source, string $target): void
    {
        $tempTarget = $target.'.new';
        File::copy($source, $tempTarget);

        if (File::exists($target)) {
            File::delete($target);
        }

        File::move($tempTarget, $target);
    }

    private function cleanup(string $tmpDir): void
    {
        if (File::exists($tmpDir)) {
            File::deleteDirectory($tmpDir);
        }
    }
}
