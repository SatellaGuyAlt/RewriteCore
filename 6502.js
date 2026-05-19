// NES 6502 CPU Emulator with ROM Loading Support
// Author: Copilot

// Registers and Flags: 
class CPU6502 {
    constructor() {
        // Registers
        this.A = 0x00;   // Accumulator
        this.X = 0x00;   // X Register
        this.Y = 0x00;   // Y Register

        // Stack Pointer, Program Counter, and Status Register
        this.SP = 0xFF;  // Stack Pointer
        this.PC = 0x0000; // Program Counter
        this.SR = 0x00;  // Status Register (Flags)

        // Memory - 64KB
        this.memory = new Uint8Array(0x10000);
    }

    reset() {
        this.PC = this.memory[0xFFFC] | (this.memory[0xFFFD] << 8);
        this.SP = 0xFD;
        this.SR = 0x34;
        this.A = this.X = this.Y = 0x00;
    }

    loadProgram(program, address = 0x8000) {
        this.memory.set(program, address);
        // Set the Reset Vector
        this.memory[0xFFFC] = address & 0xFF;
        this.memory[0xFFFD] = (address >> 8) & 0xFF;
        this.reset();
    }

    loadROM(rom) {
        // Parse the iNES header (first 16 bytes)
        if (rom[0] !== 0x4E || rom[1] !== 0x45 || rom[2] !== 0x53 || rom[3] !== 0x1A) {
            throw new Error('Invalid iNES header');
        }

        const prgSize = rom[4] * 16384; // 16KB units
        const chrSize = rom[5] * 8192;  // 8KB units

        // Load PRG ROM into memory (0x8000-0xFFFF)
        const prgROM = rom.slice(16, 16 + prgSize);
        this.loadProgram(prgROM, 0x8000);

        console.log('PRG ROM loaded:', prgSize, 'bytes');
        if (chrSize > 0) {
            console.log('CHR ROM size:', chrSize, 'bytes');
        }
    }

    fetch() {
        return this.memory[this.PC++];
    }

    executeInstruction(opcode) {
        switch(opcode) {
            case 0xA9: // LDA Immediate
                this.A = this.fetch();
                this.updateZeroNegativeFlags(this.A);
                break;

            case 0x00: // BRK
                this.PC++;
                break;

            default:
                throw new Error(`Unimplemented opcode: ${opcode}`);
        }
    }

    updateZeroNegativeFlags(value) {
        this.SR = (value === 0 ? this.SR | 0x02 : this.SR & ~0x02); // Zero Flag
        this.SR = (value & 0x80 ? this.SR | 0x80 : this.SR & ~0x80); // Negative Flag
    }

    step() {
        const opcode = this.fetch();
        this.executeInstruction(opcode);
    }
}

// Export the CPU class
module.exports = CPU6502;