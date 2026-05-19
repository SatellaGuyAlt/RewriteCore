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
        
        // Cycle counter
        this.cycles = 0;
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
        this.memory[address & 0xFFFF] = value & 0xFF;
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
        if (prgSize === 16384) {
            this.memory.set(prgROM, 0xC000); // Mirror PRG ROM at 0xC000 if 16KB
        }

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

    // Flag helpers
    setFlag(flag) {
        this.SR |= flag;
    }

    clearFlag(flag) {
        this.SR &= ~flag;
    }

    getFlag(flag) {
        return (this.SR & flag) !== 0;
    }

    updateZeroNegativeFlags(value) {
        value &= 0xFF;
        if (value === 0) {
            this.setFlag(0x02); // Zero Flag
        } else {
            this.clearFlag(0x02);
        }
        if (value & 0x80) {
            this.setFlag(0x80); // Negative Flag
        } else {
            this.clearFlag(0x80);
        }
    }

    executeInstruction(opcode) {
        switch (opcode) {
            // Load Accumulator
            case 0xA9: // LDA Immediate
                this.A = this.fetch();
                this.updateZeroNegativeFlags(this.A);
                break;

            case 0xA5: // LDA Zero Page
                {
                    const addr = this.fetch();
                    this.A = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0xAD: // LDA Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    this.A = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0xB5: // LDA Zero Page,X
                {
                    const addr = (this.fetch() + this.X) & 0xFF;
                    this.A = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0xBD: // LDA Absolute,X
                {
                    const baseAddr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    const addr = (baseAddr + this.X) & 0xFFFF;
                    this.A = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0xB9: // LDA Absolute,Y
                {
                    const baseAddr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    const addr = (baseAddr + this.Y) & 0xFFFF;
                    this.A = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0xA1: // LDA (Indirect,X)
                {
                    const zp = (this.fetch() + this.X) & 0xFF;
                    const addr = this.readWord(zp);
                    this.A = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0xB1: // LDA (Indirect),Y
                {
                    const zp = this.fetch();
                    const baseAddr = this.readWord(zp);
                    const addr = (baseAddr + this.Y) & 0xFFFF;
                    this.A = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            // Load X Register
            case 0xA2: // LDX Immediate
                this.X = this.fetch();
                this.updateZeroNegativeFlags(this.X);
                break;

            case 0xA6: // LDX Zero Page
                {
                    const addr = this.fetch();
                    this.X = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.X);
                }
                break;

            case 0xAE: // LDX Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    this.X = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.X);
                }
                break;

            // Load Y Register
            case 0xA0: // LDY Immediate
                this.Y = this.fetch();
                this.updateZeroNegativeFlags(this.Y);
                break;

            case 0xA4: // LDY Zero Page
                {
                    const addr = this.fetch();
                    this.Y = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.Y);
                }
                break;

            case 0xAC: // LDY Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    this.Y = this.readByte(addr);
                    this.updateZeroNegativeFlags(this.Y);
                }
                break;

            // Store Accumulator
            case 0x85: // STA Zero Page
                {
                    const addr = this.fetch();
                    this.writeByte(addr, this.A);
                }
                break;

            case 0x8D: // STA Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    this.writeByte(addr, this.A);
                }
                break;

            case 0x95: // STA Zero Page,X
                {
                    const addr = (this.fetch() + this.X) & 0xFF;
                    this.writeByte(addr, this.A);
                }
                break;

            case 0x9D: // STA Absolute,X
                {
                    const baseAddr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    const addr = (baseAddr + this.X) & 0xFFFF;
                    this.writeByte(addr, this.A);
                }
                break;

            case 0x99: // STA Absolute,Y
                {
                    const baseAddr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    const addr = (baseAddr + this.Y) & 0xFFFF;
                    this.writeByte(addr, this.A);
                }
                break;

            case 0x81: // STA (Indirect,X)
                {
                    const zp = (this.fetch() + this.X) & 0xFF;
                    const addr = this.readWord(zp);
                    this.writeByte(addr, this.A);
                }
                break;

            case 0x91: // STA (Indirect),Y
                {
                    const zp = this.fetch();
                    const baseAddr = this.readWord(zp);
                    const addr = (baseAddr + this.Y) & 0xFFFF;
                    this.writeByte(addr, this.A);
                }
                break;

            // Store X Register
            case 0x86: // STX Zero Page
                {
                    const addr = this.fetch();
                    this.writeByte(addr, this.X);
                }
                break;

            case 0x8E: // STX Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    this.writeByte(addr, this.X);
                }
                break;

            // Store Y Register
            case 0x84: // STY Zero Page
                {
                    const addr = this.fetch();
                    this.writeByte(addr, this.Y);
                }
                break;

            case 0x8C: // STY Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    this.writeByte(addr, this.Y);
                }
                break;

            // Add with Carry
            case 0x69: // ADC Immediate
                {
                    const val = this.fetch();
                    const carry = this.getFlag(0x01) ? 1 : 0;
                    const result = this.A + val + carry;
                    if ((~(this.A ^ val) & (this.A ^ result) & 0x80)) {
                        this.setFlag(0x40); // Overflow
                    } else {
                        this.clearFlag(0x40);
                    }
                    this.A = result & 0xFF;
                    if (result > 0xFF) {
                        this.setFlag(0x01); // Carry
                    } else {
                        this.clearFlag(0x01);
                    }
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            // Subtract with Carry
            case 0xE9: // SBC Immediate
                {
                    const val = this.fetch();
                    const carry = this.getFlag(0x01) ? 0 : 1;
                    const result = this.A - val - carry;
                    if (((this.A ^ val) & (this.A ^ result) & 0x80)) {
                        this.setFlag(0x40); // Overflow
                    } else {
                        this.clearFlag(0x40);
                    }
                    this.A = result & 0xFF;
                    if (result >= 0) {
                        this.setFlag(0x01); // Carry
                    } else {
                        this.clearFlag(0x01);
                    }
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            // Compare Accumulator
            case 0xC9: // CMP Immediate
                {
                    const val = this.fetch();
                    const result = this.A - val;
                    if (result >= 0) {
                        this.setFlag(0x01); // Carry
                    } else {
                        this.clearFlag(0x01);
                    }
                    this.updateZeroNegativeFlags(result & 0xFF);
                }
                break;

            // Increment
            case 0xE6: // INC Zero Page
                {
                    const addr = this.fetch();
                    let val = this.readByte(addr);
                    val = (val + 1) & 0xFF;
                    this.writeByte(addr, val);
                    this.updateZeroNegativeFlags(val);
                }
                break;

            case 0xEE: // INC Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    let val = this.readByte(addr);
                    val = (val + 1) & 0xFF;
                    this.writeByte(addr, val);
                    this.updateZeroNegativeFlags(val);
                }
                break;

            case 0xE8: // INX
                this.X = (this.X + 1) & 0xFF;
                this.updateZeroNegativeFlags(this.X);
                break;

            case 0xC8: // INY
                this.Y = (this.Y + 1) & 0xFF;
                this.updateZeroNegativeFlags(this.Y);
                break;

            // Decrement
            case 0xC6: // DEC Zero Page
                {
                    const addr = this.fetch();
                    let val = this.readByte(addr);
                    val = (val - 1) & 0xFF;
                    this.writeByte(addr, val);
                    this.updateZeroNegativeFlags(val);
                }
                break;

            case 0xCE: // DEC Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    let val = this.readByte(addr);
                    val = (val - 1) & 0xFF;
                    this.writeByte(addr, val);
                    this.updateZeroNegativeFlags(val);
                }
                break;

            case 0xCA: // DEX
                this.X = (this.X - 1) & 0xFF;
                this.updateZeroNegativeFlags(this.X);
                break;

            case 0x88: // DEY
                this.Y = (this.Y - 1) & 0xFF;
                this.updateZeroNegativeFlags(this.Y);
                break;

            // Branches
            case 0x10: // BPL Branch if Plus
                {
                    const offset = this.fetch();
                    if (!this.getFlag(0x80)) {
                        const signed = (offset & 0x80) ? -(256 - offset) : offset;
                        this.PC = (this.PC + signed) & 0xFFFF;
                    }
                }
                break;

            case 0x30: // BMI Branch if Minus
                {
                    const offset = this.fetch();
                    if (this.getFlag(0x80)) {
                        const signed = (offset & 0x80) ? -(256 - offset) : offset;
                        this.PC = (this.PC + signed) & 0xFFFF;
                    }
                }
                break;

            case 0xD0: // BNE Branch if Not Equal
                {
                    const offset = this.fetch();
                    if (!this.getFlag(0x02)) {
                        const signed = (offset & 0x80) ? -(256 - offset) : offset;
                        this.PC = (this.PC + signed) & 0xFFFF;
                    }
                }
                break;

            case 0xF0: // BEQ Branch if Equal
                {
                    const offset = this.fetch();
                    if (this.getFlag(0x02)) {
                        const signed = (offset & 0x80) ? -(256 - offset) : offset;
                        this.PC = (this.PC + signed) & 0xFFFF;
                    }
                }
                break;

            case 0x50: // BVC Branch if Overflow Clear
                {
                    const offset = this.fetch();
                    if (!this.getFlag(0x40)) {
                        const signed = (offset & 0x80) ? -(256 - offset) : offset;
                        this.PC = (this.PC + signed) & 0xFFFF;
                    }
                }
                break;

            case 0x70: // BVS Branch if Overflow Set
                {
                    const offset = this.fetch();
                    if (this.getFlag(0x40)) {
                        const signed = (offset & 0x80) ? -(256 - offset) : offset;
                        this.PC = (this.PC + signed) & 0xFFFF;
                    }
                }
                break;

            case 0x90: // BCC Branch if Carry Clear
                {
                    const offset = this.fetch();
                    if (!this.getFlag(0x01)) {
                        const signed = (offset & 0x80) ? -(256 - offset) : offset;
                        this.PC = (this.PC + signed) & 0xFFFF;
                    }
                }
                break;

            case 0xB0: // BCS Branch if Carry Set
                {
                    const offset = this.fetch();
                    if (this.getFlag(0x01)) {
                        const signed = (offset & 0x80) ? -(256 - offset) : offset;
                        this.PC = (this.PC + signed) & 0xFFFF;
                    }
                }
                break;

            // Stack Operations
            case 0x48: // PHA Push Accumulator
                this.writeByte(0x100 + this.SP, this.A);
                this.SP = (this.SP - 1) & 0xFF;
                break;

            case 0x68: // PLA Pull Accumulator
                this.SP = (this.SP + 1) & 0xFF;
                this.A = this.readByte(0x100 + this.SP);
                this.updateZeroNegativeFlags(this.A);
                break;

            case 0x08: // PHP Push Processor Status
                this.writeByte(0x100 + this.SP, this.SR | 0x10); // Break flag set
                this.SP = (this.SP - 1) & 0xFF;
                break;

            case 0x28: // PLP Pull Processor Status
                this.SP = (this.SP + 1) & 0xFF;
                this.SR = this.readByte(0x100 + this.SP) & ~0x10;
                break;

            // Jump
            case 0x4C: // JMP Absolute
                {
                    const addr = this.readWord(this.PC);
                    this.PC = addr;
                }
                break;

            case 0x6C: // JMP (Indirect)
                {
                    const addr = this.readWord(this.PC);
                    this.PC = this.readWord(addr);
                }
                break;

            // Jump to Subroutine
            case 0x20: // JSR
                {
                    const addr = this.readWord(this.PC);
                    this.PC = (this.PC + 2) & 0xFFFF;
                    const retAddr = (this.PC - 1) & 0xFFFF;
                    this.writeByte(0x100 + this.SP, (retAddr >> 8) & 0xFF);
                    this.SP = (this.SP - 1) & 0xFF;
                    this.writeByte(0x100 + this.SP, retAddr & 0xFF);
                    this.SP = (this.SP - 1) & 0xFF;
                    this.PC = addr;
                }
                break;

            // Return from Subroutine
            case 0x60: // RTS
                {
                    this.SP = (this.SP + 1) & 0xFF;
                    let addr = this.readByte(0x100 + this.SP);
                    this.SP = (this.SP + 1) & 0xFF;
                    addr |= this.readByte(0x100 + this.SP) << 8;
                    this.PC = (addr + 1) & 0xFFFF;
                }
                break;

            // Break
            case 0x00: // BRK
                this.PC = (this.PC + 2) & 0xFFFF;
                this.setFlag(0x10); // Break flag
                break;

            // Return from Interrupt
            case 0x40: // RTI
                {
                    this.SP = (this.SP + 1) & 0xFF;
                    this.SR = this.readByte(0x100 + this.SP);
                    this.SP = (this.SP + 1) & 0xFF;
                    let addr = this.readByte(0x100 + this.SP);
                    this.SP = (this.SP + 1) & 0xFF;
                    addr |= this.readByte(0x100 + this.SP) << 8;
                    this.PC = addr;
                }
                break;

            // No Operation
            case 0xEA: // NOP
                break;

            // Logical Operations
            case 0x29: // AND Immediate
                {
                    const val = this.fetch();
                    this.A &= val;
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0x09: // ORA Immediate
                {
                    const val = this.fetch();
                    this.A |= val;
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0x49: // EOR Immediate (XOR)
                {
                    const val = this.fetch();
                    this.A ^= val;
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            // Shifts and Rotates
            case 0x0A: // ASL Accumulator
                {
                    const carry = (this.A & 0x80) ? 1 : 0;
                    this.A = (this.A << 1) & 0xFF;
                    if (carry) {
                        this.setFlag(0x01);
                    } else {
                        this.clearFlag(0x01);
                    }
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0x4A: // LSR Accumulator
                {
                    const carry = this.A & 0x01;
                    this.A >>= 1;
                    if (carry) {
                        this.setFlag(0x01);
                    } else {
                        this.clearFlag(0x01);
                    }
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0x2A: // ROL Accumulator
                {
                    const carry = this.getFlag(0x01) ? 1 : 0;
                    const newCarry = (this.A & 0x80) ? 1 : 0;
                    this.A = ((this.A << 1) | carry) & 0xFF;
                    if (newCarry) {
                        this.setFlag(0x01);
                    } else {
                        this.clearFlag(0x01);
                    }
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            case 0x6A: // ROR Accumulator
                {
                    const carry = this.getFlag(0x01) ? 1 : 0;
                    const newCarry = this.A & 0x01;
                    this.A = ((this.A >> 1) | (carry << 7)) & 0xFF;
                    if (newCarry) {
                        this.setFlag(0x01);
                    } else {
                        this.clearFlag(0x01);
                    }
                    this.updateZeroNegativeFlags(this.A);
                }
                break;

            // Transfer Operations
            case 0xAA: // TAX Transfer A to X
                this.X = this.A;
                this.updateZeroNegativeFlags(this.X);
                break;

            case 0xA8: // TAY Transfer A to Y
                this.Y = this.A;
                this.updateZeroNegativeFlags(this.Y);
                break;

            case 0xBA: // TSX Transfer SP to X
                this.X = this.SP;
                this.updateZeroNegativeFlags(this.X);
                break;

            case 0x8A: // TXA Transfer X to A
                this.A = this.X;
                this.updateZeroNegativeFlags(this.A);
                break;

            case 0x9A: // TXS Transfer X to SP
                this.SP = this.X;
                break;

            case 0x98: // TYA Transfer Y to A
                this.A = this.Y;
                this.updateZeroNegativeFlags(this.A);
                break;

            // Flag Operations
            case 0x18: // CLC Clear Carry
                this.clearFlag(0x01);
                break;

            case 0x38: // SEC Set Carry
                this.setFlag(0x01);
                break;

            case 0x58: // CLI Clear Interrupt Disable
                this.clearFlag(0x04);
                break;

            case 0x78: // SEI Set Interrupt Disable
                this.setFlag(0x04);
                break;

            case 0xB8: // CLV Clear Overflow
                this.clearFlag(0x40);
                break;

            case 0xD8: // CLD Clear Decimal
                this.clearFlag(0x08);
                break;

            case 0xF8: // SED Set Decimal
                this.setFlag(0x08);
                break;

            default:
                console.warn(`Unimplemented opcode: 0x${opcode.toString(16).padStart(2, '0').toUpperCase()}`);
                break;
        }
    }
}

// Enhanced Picture Processing Unit (PPU) Class
class PPU {
    constructor() {
        this.vram = new Uint8Array(0x4000); // Video RAM
        this.oam = new Uint8Array(256); // Sprite Memory
        this.paletteRam = new Uint8Array(32); // Palette RAM
        
        this.cycle = 0;
        this.scanline = 0;
        this.frameNumber = 0;
        
        // PPU Registers
        this.ppuctrl = 0x00;    // 0x2000
        this.ppumask = 0x00;    // 0x2001
        this.ppustatus = 0x80;  // 0x2002
        this.oamaddr = 0x00;    // 0x2003
        this.ppuscroll = 0x00;  // 0x2005
        this.ppuaddr = 0x0000;  // 0x2006
        this.ppudata = 0x00;    // 0x2007
        
        // Internal registers
        this.v = 0x0000;        // VRAM address
        this.t = 0x0000;        // Temporary VRAM address
        this.x = 0x00;          // Fine X scroll
        this.w = false;         // Write toggle
        this.dataBuffer = 0x00;
    }

    step() {
        this.cycle++;
        
        // NES PPU timing: 341 cycles per scanline, 262 scanlines per frame
        if (this.cycle >= 341) {
            this.cycle = 0;
            this.scanline++;
            
            if (this.scanline === 241) {
                // Set VBlank flag
                this.ppustatus |= 0x80;
            }
            
            if (this.scanline >= 262) {
                this.scanline = 0;
                this.frameNumber++;
                // Clear VBlank flag
                this.ppustatus &= ~0x80;
            }
        }
    }

    readRegister(address) {
        switch (address) {
            case 0x2002: // PPUSTATUS
                const status = this.ppustatus;
                this.ppustatus &= ~0x80; // Clear VBlank on read
                this.w = false; // Reset write toggle
                return status;

            case 0x2007: // PPUDATA
                {
                    let data;
                    if (this.v < 0x3F00) {
                        data = this.dataBuffer;
                        this.dataBuffer = this.readVRAM(this.v);
                    } else {
                        data = this.readPalette(this.v);
                        this.dataBuffer = this.readVRAM(this.v - 0x1000);
                    }
                    this.incrementVRAMAddress();
                    return data;
                }

            default:
                return 0x00;
        }
    }

    writeRegister(address, value) {
        switch (address) {
            case 0x2000: // PPUCTRL
                this.ppuctrl = value;
                this.t = (this.t & ~0x0C00) | ((value & 0x03) << 10);
                break;

            case 0x2001: // PPUMASK
                this.ppumask = value;
                break;

            case 0x2003: // OAMADDR
                this.oamaddr = value;
                break;

            case 0x2004: // OAMDATA
                this.oam[this.oamaddr] = value;
                this.oamaddr++;
                break;

            case 0x2005: // PPUSCROLL
                if (!this.w) {
                    this.x = value & 0x07;
                    this.t = (this.t & ~0x1F) | ((value >> 3) & 0x1F);
                    this.w = true;
                } else {
                    this.t = (this.t & ~0x73E0) | (((value & 0x07) << 12) | ((value & 0xF8) << 2));
                    this.w = false;
                }
                break;

            case 0x2006: // PPUADDR
                if (!this.w) {
                    this.t = (this.t & ~0xFF00) | ((value & 0x3F) << 8);
                    this.w = true;
                } else {
                    this.t = (this.t & ~0x00FF) | value;
                    this.v = this.t;
                    this.w = false;
                }
                break;

            case 0x2007: // PPUDATA
                this.writeVRAM(this.v, value);
                this.incrementVRAMAddress();
                break;
        }
    }

    readVRAM(address) {
        address &= 0x3FFF;
        if (address < 0x3F00) {
            return this.vram[address];
        } else {
            return this.readPalette(address);
        }
    }

    writeVRAM(address, value) {
        address &= 0x3FFF;
        if (address < 0x3F00) {
            this.vram[address] = value;
        } else {
            this.writePalette(address, value);
        }
    }

    readPalette(address) {
        address = (address & 0x1F);
        if (address === 0x10) address = 0x00;
        if (address === 0x14) address = 0x04;
        if (address === 0x18) address = 0x08;
        if (address === 0x1C) address = 0x0C;
        return this.paletteRam[address];
    }

    writePalette(address, value) {
        address = (address & 0x1F);
        if (address === 0x10) address = 0x00;
        if (address === 0x14) address = 0x04;
        if (address === 0x18) address = 0x08;
        if (address === 0x1C) address = 0x0C;
        this.paletteRam[address] = value;
    }

    incrementVRAMAddress() {
        const increment = (this.ppuctrl & 0x04) ? 32 : 1;
        this.v = (this.v + increment) & 0x7FFF;
    }
}

module.exports = { CPU6502, PPU };
