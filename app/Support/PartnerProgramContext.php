<?php

namespace App\Support;

use App\Models\PartnerProgram;

class PartnerProgramContext
{
    protected ?int $partnerProgramId = null;

    protected ?PartnerProgram $partnerProgram = null;

    public function setPartnerProgramId(?int $partnerProgramId): void
    {
        $this->partnerProgramId = $partnerProgramId;
        $this->partnerProgram = null;
    }

    public function setPartnerProgram(?PartnerProgram $partnerProgram): void
    {
        $this->partnerProgram = $partnerProgram;
        $this->partnerProgramId = $partnerProgram?->id;
    }

    public function getPartnerProgramId(): ?int
    {
        return $this->partnerProgramId;
    }

    public function getPartnerProgram(): ?PartnerProgram
    {
        if ($this->partnerProgram) {
            return $this->partnerProgram;
        }

        if ($this->partnerProgramId === null) {
            return null;
        }

        $this->partnerProgram = PartnerProgram::find($this->partnerProgramId);

        return $this->partnerProgram;
    }

    public function clear(): void
    {
        $this->partnerProgramId = null;
        $this->partnerProgram = null;
    }
}
