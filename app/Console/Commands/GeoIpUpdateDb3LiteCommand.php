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

        $url = $this->resolveUrl();
        $targetPath = (string) ($this->option('target') ?: config('geoip.ip2location.database_path'));

        if ($url === null) {
            if ($this->option('force')) {
                $this->error('No download source configured. Set GEOIP_AUTO_UPDATE_TOKEN (+ package) or GEOIP_AUTO_UPDATE_URL.');

                return self::FAILURE;
            }

            $this->warn('GeoIP source is not configured. Set GEOIP_AUTO_UPDATE_TOKEN or GEOIP_AUTO_UPDATE_URL.');

            return self::SUCCESS;
        }

        if ($targetPath === '') {
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

            if ($this->isHtml($zipPath) || str_contains(strtolower((string) $response->header('Content-Type', '')), 'text/html')) {
                $this->error('Unexpected HTML response from download endpoint. Check GEOIP_AUTO_UPDATE_TOKEN / package / URL.');
                $this->cleanup($tmpDir);

                return self::FAILURE;
            }

            $sourceBin = $this->resolveBinSource($zipPath, $tmpDir.'/extract');
            if (! $sourceBin) {
                $this->error('Could not extract .BIN file from downloaded payload.');
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

    private function resolveUrl(): ?string
    {
        $overrideUrl = trim((string) $this->option('url'));
        if ($overrideUrl !== '') {
            return $overrideUrl;
        }

        $configuredUrl = trim((string) config('geoip.auto_update.url', ''));
        if ($configuredUrl !== '') {
            return $configuredUrl;
        }

        $token = trim((string) config('geoip.auto_update.token', ''));
        if ($token === '') {
            return null;
        }

        $package = trim((string) config('geoip.auto_update.package', 'DB3LITEBINIPV6'));
        if ($package === '') {
            return null;
        }

        $endpoint = rtrim(trim((string) config('geoip.auto_update.endpoint', 'https://www.ip2location.com/download/')), '/').'/';

        return $endpoint.'?'.http_build_query([
            'token' => $token,
            'file' => $package,
        ], '', '&', PHP_QUERY_RFC3986);
    }

    private function readMeta(string $path): array
    {
        if (! File::exists($path)) {
            return [];
        }

        $decoded = json_decode((string) File::get($path), true);

        return is_array($decoded) ? $decoded : [];
    }

    private function resolveBinSource(string $downloadPath, string $extractDir): ?string
    {
        if (! File::exists($downloadPath) || (filesize($downloadPath) ?: 0) === 0) {
            return null;
        }

        if ($this->isZipArchive($downloadPath)) {
            return $this->extractBinFromZip($downloadPath, $extractDir);
        }

        return $downloadPath;
    }

    private function isZipArchive(string $path): bool
    {
        $handle = @fopen($path, 'rb');
        if (! $handle) {
            return false;
        }

        $signature = fread($handle, 4);
        fclose($handle);

        return in_array($signature, ["PK\x03\x04", "PK\x05\x06", "PK\x07\x08"], true);
    }

    private function isHtml(string $path): bool
    {
        $handle = @fopen($path, 'rb');
        if (! $handle) {
            return false;
        }

        $head = (string) fread($handle, 512);
        fclose($handle);

        return preg_match('/<\s*html|<!DOCTYPE\s+html/i', $head) === 1;
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
