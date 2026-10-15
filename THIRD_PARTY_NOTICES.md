# Third-party notices

Parts of these instructions adapt ideas and organization from [pstack](https://github.com/cursor/plugins/tree/main/pstack), by Lauren Tan:

- [`correct`](https://github.com/cursor/plugins/blob/main/pstack/skills/correct/SKILL.md): recurring corrections and structural enforcement.
- [`blast-radius`](https://github.com/cursor/plugins/blob/main/pstack/skills/blast-radius/SKILL.md): proving the premise a change's safety depends on.
- [`principle-separate-before-serializing-shared-state`](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md): removing unnecessary shared writes before adding serialization.
- [`principle-attack-the-premise`](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-attack-the-premise/SKILL.md): testing an assumption shared by repeatedly unsuccessful fixes.
- [`architect`](https://github.com/cursor/plugins/blob/main/pstack/skills/architect/SKILL.md): deriving an interface from representative caller usage.

The adaptations do not bundle pstack's Cursor-specific orchestration, model routing, or automation. The upstream license notice follows.

## pstack — MIT License

Copyright (c) 2026 Lauren Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
