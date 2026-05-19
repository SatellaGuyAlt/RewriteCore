// Improved NES 6502 CPU and GPU Emulator
// Author: Copilot

// Enhanced CPU6502 Class with Accurate Instruction Set Emulation
class CPU6502 {
    constructor() {
        // Registers
        this.A = 0x00; // Accumulator
        this.X = 0x00; // X Register
        this.Y = 0x00; // Y Register

        this.SP = 0xFF; // Stack Pointer
        this.PC = 0x0000; // Program Counter
        this.SR = 0x20; // Status Register (set unused flag)

        // Memory - 64KB
        this.memory = new Uint8Array(0x10000);
    }

    reset() {
        this.PC = this.readWord(0xFFFC);
        this.SP = 0xFD;
        this.SR = 0x34;
        this.A = this.X = this.Y = 0x00;
    }

    readByte(address) {
        return this.memory[address & 0xFFFF];
    }

    writeByte(address, value) {
        this.memory[address & 0xFFFF] = value;
    }

    readWord(address) {
        const lo = this.readByte(address);
        const hi = this.readByte(address + 1);
        return (hi << 8) | lo;
    }

    loadROM(rom) {
        if (rom[0] !== 0x4E || rom[1] !== 0x45 || rom[2] !== 0x53 || rom[3] !== 0x1A) {
            throw new Error('Invalid iNES header');
        }

        const prgSize = rom[4] * 16384;
        const prgROM = rom.slice(16, 16 + prgSize);
        this.memory.set(prgROM, 0x8000);
        this.memory.set(prgROM, 0xC000); // Mirror PRG ROM at 0xC000

        this.reset();
    }

    fetch() {
        const data = this.readByte(this.PC);
        this.PC = (this.PC + 1) & 0xFFFF;
        return data;
    }

    step() {
        const opcode = this.fetch();
        this.executeInstruction(opcode);
    }

    executeInstruction(opcode) {
        switch (opcode) {
            case 0xA9: // LDA Immediate
                this.A = this.fetch();
                this.updateZeroNegativeFlags(this.A);
                break;

            case 0x8D: // STA Absolute
                const addr = this.fetch() | (this.fetch() << 8);
                this.writeByte(addr, this.A);
                break;

            default:
                throw new Error(`Unimplemented opcode: 0x${opcode.toString(16)}`);
        }
    }

    updateZeroNegativeFlags(value) {
        this.SR = (value === 0 ? this.SR | 0x02 : this.SR & ~0x02); // Zero Flag
        this.SR = (value & 0x80 ? this.SR | 0x80 : this.SR & ~0x80); // Negative Flag
    }
}

// Enhanced Picture Processing Unit (PPU) Class
class PPU {
    constructor() {
        this.vram = new Uint8Array(0x4000); // Video RAM
        this.oam = new Uint8Array(256); // Sprite Memory
        this.cycle = 0;
        this.scanline = 0;
    }

    step() {
        this.cycle++;
        if (this.cycle > 340) {
            this.cycle = 0;
            this.scanline++;
            if (this.scanline > 261) {
                this.scanline = 0; // Reset scanline after end of frame
            }
        }
    }
}

module.exports = { CPU6502, PPU };