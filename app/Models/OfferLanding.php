<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class OfferLanding extends Model
{
    protected $fillable = [
        'offer_id',
        'type',
        'name',
        'file_path',
        'preview_path',
        'url',
        'size',
    ];

    protected $appends = ['download_url', 'preview_url'];

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function getDownloadUrlAttribute(): ?string
    {
        if ($this->type !== 'local' || ! $this->file_path) {
            return null;
        }

        return route('landings.download', $this);
    }

    public function getPreviewUrlAttribute(): ?string
    {
        if ($this->type === 'link') {
            return $this->url;
        }

        if ($this->preview_path) {
            return Storage::url($this->preview_path);
        }

        return null;
    }
}
