import { s32, Struct, u16, u32, u8 } from "@yume-chan/struct";

import type { ScrcpyInjectScrollControlMessage } from "../../control/index.js";
import { ScrcpyControlMessageType } from "../../control/index.js";

export interface ScrcpyScrollController {
    serializeScrollMessage(
        message: ScrcpyInjectScrollControlMessage,
    ): Uint8Array | undefined;
}

export const ScrcpyInjectScrollControlMessage1_16 = new Struct(
    {
        type: u8.as(ScrcpyControlMessageType.InjectScroll as const),
        pointerX: u32,
        pointerY: u32,
        screenWidth: u16,
        screenHeight: u16,
        scrollX: s32,
        scrollY: s32,
    },
    { littleEndian: false },
);

/**
 * Old version of Scrcpy server only supports integer values for scroll.
 *
 * Accumulate scroll values and send scroll message when accumulated value
 * reaches 1 or -1.
 */
export class ScrcpyScrollController1_16 implements ScrcpyScrollController {
    #accumulatedX = 0;
    #accumulatedY = 0;

    protected processMessage(
        message: ScrcpyInjectScrollControlMessage,
    ): ScrcpyInjectScrollControlMessage | undefined {
        this.#accumulatedX += message.scrollX;
        this.#accumulatedY += message.scrollY;

        let scrollX = 0;
        let scrollY = 0;
        if (this.#accumulatedX >= 1) {
            scrollX = 1;
            this.#accumulatedX = 0;
        } else if (this.#accumulatedX <= -1) {
            scrollX = -1;
            this.#accumulatedX = 0;
        }

        if (this.#accumulatedY >= 1) {
            scrollY = 1;
            this.#accumulatedY = 0;
        } else if (this.#accumulatedY <= -1) {
            scrollY = -1;
            this.#accumulatedY = 0;
        }

        if (scrollX === 0 && scrollY === 0) {
            return undefined;
        }

        message.scrollX = scrollX;
        message.scrollY = scrollY;
        return message;
    }

    serializeScrollMessage(
        message: ScrcpyInjectScrollControlMessage,
    ): Uint8Array | undefined {
        const processed = this.processMessage(message);
        if (!processed) {
            return undefined;
        }

        return ScrcpyInjectScrollControlMessage1_16.serialize(processed);
    }
}
