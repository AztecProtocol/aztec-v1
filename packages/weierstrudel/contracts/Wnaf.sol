pragma solidity ^0.4.23;

// Used to test gas costs for wnaf algorithm, includes setup and return code but not the acutal algorithm, so we can diff gas costs
// (about 4,400 gas for a 256 bit scalar. Not bad! The divide-by-2 method costs about 20,000 gas)
contract DummyContract {
    function () public {
        assembly {
            mstore(0x1f, 0x0000016d02d06e1303dad1e66f8e14310469dbdfd280e7b070948f3b15bb3200)
            mstore(0x3f, 0x05476ae3dc38e0fbd3c881fee89eb120712695d690c43caa1640bccb330c00ed)
            mstore(0x5f, 0x065248846b11e42fddae3900e1f9fc1ed4a8c9eb822dff1ce91a9fa1b26421a3)
            mstore(0x7f, 0x727a27b49600d7669144c5233d4faba517774174bd5ccc7c34c00d290058eeb6)
            mstore(0x9f, 0x075f539849f285006ccf12d9e58d3068de7faf933aba0046e237fac7fd9d1f25)
            mstore(0xbf, 0xd5c3a93fca0bec5183102ead00f81da7ea2c1b19a063a279b3006543224ea476)
            mstore(0xdf, 0x735b7bbf2857b55e97f100ced88c677e92b94536c69c24c23e0a500facf7a62b)
            mstore(0xff, 0x18627800424d755abe565df0cd8b7db8359bc1090ef62a61004c5955ef8ab79a)
            mstore(0x11f, 0x08f5604b548999f44a88f3878600000000000000000000000000000000000000)
        
        
            0x140               // this will be the start of where we store the snaf
            calldataload(0x04) // get scalar to wnaf-ifize
            0x120
            0x140
            return
            pop
            pop
        }
    }
}

// An interface for 'Wnaf' so we an send data to fallback functions through truffle
contract WnafInterface {
    function calculateWnaf(uint) public returns(uint[10]) {}
    function calculateWnafPure(uint) public view returns(uint[10]) {}
}

contract Wnaf{
    function () public {
        assembly {
            // righto, what are we doing here?
            // the standard way to calculate a window-non adjacent form is to
            // divide the scalar down by 2 until the scalar is odd (and keep track of the bit index as we divide down)
            // we then take the value of the scalar mod 2^(window size)
            // this is our wnaf value for the calculated bit position , after accounting for negative values
            // we then subtract off the wnaf from the scalar (if the wnaf is negative this will increase the scalar),
            // divide by 2 again and keep going until our scalar = 0

            // however, we can cheat quite a bit here
            // first of all, instead of dividing down by 2 until we find an odd bit,
            // it's much cheaper to calculate the bit index of the least significant high bit
            // by using some bitwise shenanigans and a lookup table

            // this removes a lot of conditional jumps that we would otherwise need and is MUCH cheaper
            // we hard-code for a window size of 5; this resulting wnaf has a hamming weight of 1/6
            // i.e. using the divide-by-2 method results in aimlessly dividing by 2 5/6th of the time,
            // and only doing anything interesting in 1/6 of all iterations
            
            // Once we isolate the least significant high bit, we can then use that as the denominator to
            // divide down our scalar, instead of iteratively dividing by 2

            // To start with, we need a lookup table.
            // The most efficient way I can come up with for getting the index of the least significant high bit
            // is to isolate the lsb and take the result of that value modulo 269.
            // 269 is relatively prime to 2^n for all n from 0 to 256, resulting in 256 unique integers < 269.
            // We then convert these into the correct bit positions by using a lookup table

            // I think it's possible to use the isolated bit as a divisor against some constant to get
            // 256 unique integers, but I think that technique requires a mask in addition to a lookup table

            // Anyhow, here's the table. It's calculated in 'js_snippets/find_lookup_table.js'
            // We use (scalar mod 269) directly to byte-address memory. Beause the evm
            // loads data in 32-byte machine words, we need to offset the table by 31 bytes so that
            // the relevant lookup value is in the least significant byte and can be masked off
            // TODO: We could store this table directly in code and use CODECOPY to save in memory
            // Would be cheaper but requires modifying the bytecode directly which is...eugh, can't be bothered 
            0x0000016d02d06e1303dad1e66f8e14310469dbdfd280e7b070948f3b15bb3200 0x1f mstore
            0x05476ae3dc38e0fbd3c881fee89eb120712695d690c43caa1640bccb330c00ed 0x3f mstore
            0x065248846b11e42fddae3900e1f9fc1ed4a8c9eb822dff1ce91a9fa1b26421a3 0x5f mstore
            0x727a27b49600d7669144c5233d4faba517774174bd5ccc7c34c00d290058eeb6 0x7f mstore
            0x075f539849f285006ccf12d9e58d3068de7faf933aba0046e237fac7fd9d1f25 0x9f mstore
            0xd5c3a93fca0bec5183102ead00f81da7ea2c1b19a063a279b3006543224ea476 0xbf mstore
            0x735b7bbf2857b55e97f100ced88c677e92b94536c69c24c23e0a500facf7a62b 0xdf mstore
            0x18627800424d755abe565df0cd8b7db8359bc1090ef62a61004c5955ef8ab79a 0xff mstore
            0x08f5604b548999f44a88f3878600000000000000000000000000000000000000 0x11f mstore
        
        
            // To start out our algorithm, we place an offset on the stack ('o'); this is where we'll start
            // string the wnaf in memory
            0x140
            // Now load the scalar onto the stack ('w')
            0x04 calldataload // stack state: w o

            dup1 wnaf_start jumpi // we should check that there's actually some data to operate on
            0x00 0x00 return

        // MAIN LOOP
            wnaf_start:
            // Step 1: we need to isolate the least significant high bit of w
            // Can do this by taking w & -w
            // This function isn't payable for a reason!
            // Instead of pushing '0' onto the stack (3 gas), we can get the amount of ether sent by the tx sender
            // As we throw if this is > 0, it's a cheaper (2 gas) way of shoving 0 onto the stack
            dup1 dup1 callvalue sub  // stack state: (0 - w) w w o
            and              // w' w o

            // Step 2: use w' and the lookup table to calculate the bit index of the high bit in w'
            // We want to add this offset to 'o', which is our accumulated memory offset
            // So swap 'o' to the front of the stak in preparation
            swap2            // stack state: o w w'

            // We want to calculate w' mod 269; the literal needs to preceed w' so push it onto the stack
            // before duplicating w' (we don't consume w' as we need it later) and taking the modulus
            269
            dup4             // stack state: w' 269 o w w'
            mod              // stack state: (w' % 269) o w w'

            mload            // use the result to byte-address the lookup table we stored
            0xff and         // and mask off all but the low byte

            // Tadaa, we have our index, no conditional branching in sight
            // We only need this value to find the right byte-offset to store our wnaf, so add it straight to 'o'
            add             // stack state: o w w'

            // Now we know *where* to store the next wnaf section, we need to figure out *what* to store
            // Our scalar has an abritrary amount of leading 0 bits we need to remove, we can use w' as
            // our divisor without explicitly figuring out how many bits need to be culled
            swap2            // get w' in front of w on the stack. Needs two swap ops. Disgusting!
            swap1            // stack state: w w' o
            div              // w o

            // To get the actual scalar value we want to store at this bit index, we usually would take
            // w mod 2^(window size). We hardcode a window size of 5, so this can be simplified to (w & 31)
            // However...we don't need to do any of this right now. When we eventually *load* our wnaf,
            // we will need to mask off all but the least significant byte, else other wnaf elements will gum up our variable
            // due to the evm's 32-byte word size.
            // So we might as well kill two birds with one stone and mask off all but the least significant 5 bits when we load our wnaf
            // and not bother with that right now.

            // Instead, we just store the least significant *byte* at our calculated memory offset, using mstore8
            // No masks required. We don't need to bother with negative numbers either; the 5th bit of the wnaf
            // fragment is our negative flag and we can deal with the fallout later
            dup1             // copy w. Stack state: w w o
            dup3             // copy o. Stack state: o w w o
            mstore8          // store our wnaf fragment

            // Right, what's left now? We need to prepare our scalar for the next round of iteration
            // We've already stored the next 5 bits of the wnaf in our fragment at memory offset 'o'
            // So we need to zero out the 5 least significant bits so we don't double-count.
            // We *could* divide down by 2^5, but div operations are expensive and we don't save anything as
            // our lookup table shenanigans divide down the scalar by the required amount in the next cycle.

            // So instead we just calculate (w & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0)
            // (the literal has every bit set high except the least significant 5)

            // There is one catch. If our wnaf fragment is negative (> 15), we need to add 32 to the scalar.
            // There are a few ways to do this. The fastest I found was to isolate the 5th significant bit of the scalar
            // and double it. If the wnaf fragment is > 15 this bit will be high, and doubling gives us 32.

            // A lookup table is 3 gas cheaper, but we're already using the required memory locations for our *other* lookup table,
            // and using an offset to get to a different lookup table is less efficient than doing this methodl
            dup1 0x10 and   // mask off all but 5th bit
            dup1 add        // and double it. Adding the value to itself is 2 gas cheaper than multiplying by 2
            
            // Stack state: (w > 15? 32 : 0) w o
            add // add back into w

            // Righto, now all that's left is to mask out the lowest 5 bits
            0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0 and

            // And we're done with one round of iteration.
            // We want to keep iterating until our scalar has been reduced down to 0 and we have our
            // wnaf chunks stored in memory

            // So, the condition test to iterate is...the scalar itself. Convenient.
            // JUMPI is sometimes documented as a conditional jump that jumps if the condition value == 1,
            // but in reality the conditional jump succeeds if the condition value != 0
            dup1 wnaf_start jumpi

            // The only way we've reached this part of the code is if w = 0, so we're done.
            // Return 9 words, starting at the starting index of our wnaf (0x140).
            // Maximum number of wnaf chunks = 256 + 3 = 258 bytes = 9 machine words
            0x120 0x140 return

            // Overall size of main loop = 31 opcodes.
            // With an average hamming weight of 1/6, the main loop is run about 256/6 ~ 42.667 times.
            // Main loop gas cost = (1 label (1 gas) + 1 v.low (2 gas, hon hon) + 26 low (3 gas) + 2 mid (5 gas) + 1 high (10 gas)) = 101 gas.
            // In addition a wnaf is stored in 9 machine words which is ~ 27 gas in gas expansion costs.
            // Average total cost ~ 4,338 gas.
            // (we never popped off 'w' or 'o' from the stack. After all why bother, that costs 4 gas!
            // The compiler complains about an unbalanced stack so we add them here to play nice.
            pop pop
        }
    }
}