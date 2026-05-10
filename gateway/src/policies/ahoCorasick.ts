/**
 * Aho-Corasick multi-pattern string matcher.
 *
 * Used by the prompt-injection scanner to find ANY of N needles in a single
 * pass over the haystack — O(n + m + matches) where n=haystack length,
 * m=total pattern characters. The previous implementation called
 * `text.includes(needle)` N times which was O(N×n×m) in the worst case.
 *
 * The implementation is a textbook AC automaton:
 *   1. Build a trie keyed on UTF-16 code units.
 *   2. BFS to compute failure / dictSuffix links.
 *   3. Walk haystack one char at a time, follow goto/failure, emit matches.
 *
 * We key on UTF-16 code units rather than full code points because the
 * inputs are mostly ASCII / BMP characters and using code units keeps the
 * trie nodes small. For non-BMP characters this could still match correctly
 * (since both sides are encoded the same way) — it's only "wrong" if a
 * pattern is interpreted as code points but compared as code units, which
 * we don't do anywhere in the gateway.
 */

interface Node {
  children: Map<number, Node>;
  fail: Node | null;
  /** Pattern indices that end at this node. */
  outputs: number[];
}

export class AhoCorasick {
  private readonly root: Node = makeNode();
  /** Lowercased patterns kept for verification + onMatch excerpting. */
  readonly needles: string[];
  private built = false;

  constructor(needles: string[]) {
    this.needles = needles.map(n => n.toLowerCase());
    for (let i = 0; i < this.needles.length; i++) {
      const n = this.needles[i];
      if (!n) continue;
      this.add(i, n);
    }
    this.build();
  }

  private add(index: number, needle: string): void {
    let node = this.root;
    for (let i = 0; i < needle.length; i++) {
      const code = needle.charCodeAt(i);
      let next = node.children.get(code);
      if (!next) {
        next = makeNode();
        node.children.set(code, next);
      }
      node = next;
    }
    node.outputs.push(index);
  }

  private build(): void {
    if (this.built) return;
    const queue: Node[] = [];
    for (const child of Array.from(this.root.children.values())) {
      child.fail = this.root;
      queue.push(child);
    }
    while (queue.length > 0) {
      const node = queue.shift()!;
      for (const entry of Array.from(node.children.entries())) {
        const code = entry[0];
        const child = entry[1];
        // Find failure link by walking up node.fail chain.
        let f = node.fail;
        while (f && !f.children.has(code)) {
          f = f.fail;
        }
        child.fail = f ? (f.children.get(code) ?? this.root) : this.root;
        // Merge dictionary outputs from the failure link.
        for (const o of child.fail.outputs) child.outputs.push(o);
        queue.push(child);
      }
    }
    this.built = true;
  }

  /**
   * Return the unique pattern indices that occur in `haystack`. The caller
   * is expected to lowercase the haystack before passing it in. Order of
   * returned indices is "first occurrence in haystack"; duplicates are
   * removed so a payload that appears 3× still only shows once.
   */
  matchIndices(haystack: string): number[] {
    const seen = new Set<number>();
    const out: number[] = [];
    let node = this.root;
    for (let i = 0; i < haystack.length; i++) {
      const code = haystack.charCodeAt(i);
      // Follow failure links until a goto exists or we hit the root.
      let next = node.children.get(code);
      while (!next && node !== this.root && node.fail) {
        node = node.fail;
        next = node.children.get(code);
      }
      node = next ?? this.root;
      if (node.outputs.length === 0) continue;
      for (const idx of node.outputs) {
        if (seen.has(idx)) continue;
        seen.add(idx);
        out.push(idx);
      }
    }
    return out;
  }
}

function makeNode(): Node {
  return { children: new Map(), fail: null, outputs: [] };
}
