<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use ZipArchive;

class GeoIpUpdateDb3LiteCommandTest extends TestCase
{
    public function test_it_downloads_and_extracts_db3_bin(): void
    {
        if (! class_exists(ZipArchive::class)) {
            $this->markTestSkipped('zip extension is not installed.');
        }

        $targetDir = storage_path('framework/testing/ip2location');
        $targetPath = $targetDir.'/IP2LOCATION-LITE-DB3.BIN';
        $metaPath = $targetDir.'/ip2location-db3-lite.meta.json';

        File::deleteDirectory($targetDir);
        File::ensureDirectoryExists($targetDir);

        $zipPath = tempnam(sys_get_temp_dir(), 'db3');
        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('IP2LOCATION-LITE-DB3.BIN', 'DB3-LITE-CONTENT');
        $zip->close();

        $zipBytes = file_get_contents($zipPath);
        $this->assertIsString($zipBytes);

        Http::fake([
            'https://example.test/db3.zip' => Http::response($zipBytes, 200, [
                'ETag' => '"etag-v1"',
                'Last-Modified' => 'Wed, 01 Jan 2025 00:00:00 GMT',
            ]),
        ]);

        config()->set('geoip.auto_update.url', 'https://example.test/db3.zip');
        config()->set('geoip.ip2location.database_path', $targetPath);
        config()->set('geoip.auto_update.enabled', true);

        $this->artisan('geoip:update-db3-lite')->assertExitCode(0);

        $this->assertFileExists($targetPath);
        $this->assertSame('DB3-LITE-CONTENT', file_get_contents($targetPath));
        $this->assertFileExists($metaPath);

        $meta = json_decode((string) file_get_contents($metaPath), true);
        $this->assertIsArray($meta);
        $this->assertSame('"etag-v1"', $meta['etag'] ?? null);
    }

    public function test_it_uses_conditional_headers_and_handles_not_modified(): void
    {
        $targetDir = storage_path('framework/testing/ip2location-304');
        $targetPath = $targetDir.'/IP2LOCATION-LITE-DB3.BIN';
        $metaPath = $targetDir.'/ip2location-db3-lite.meta.json';

        File::deleteDirectory($targetDir);
        File::ensureDirectoryExists($targetDir);
        File::put($metaPath, json_encode([
            'etag' => '"etag-v1"',
            'last_modified' => 'Wed, 01 Jan 2025 00:00:00 GMT',
        ]));

        Http::fake(function ($request) {
            $this->assertSame('"etag-v1"', $request->header('If-None-Match')[0] ?? null);
            $this->assertSame('Wed, 01 Jan 2025 00:00:00 GMT', $request->header('If-Modified-Since')[0] ?? null);

            return Http::response('', 304);
        });

        config()->set('geoip.auto_update.url', 'https://example.test/db3.zip');
        config()->set('geoip.ip2location.database_path', $targetPath);
        config()->set('geoip.auto_update.enabled', true);

        $this->artisan('geoip:update-db3-lite')->assertExitCode(0);
    }
}
