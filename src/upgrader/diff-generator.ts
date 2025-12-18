export interface FileDiff {
  file: string;
  type: "added" | "modified" | "deleted";
  before?: string;
  after?: string;
  hunks?: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "add" | "remove" | "context";
  content: string;
}

export class DiffGenerator {
  generateFileDiff(
    oldContent: string | undefined,
    newContent: string | undefined
  ): FileDiff["hunks"] {
    if (!oldContent && newContent) {
      return [];
    }
    if (oldContent && !newContent) {
      return [];
    }
    if (!oldContent || !newContent) {
      return [];
    }

    const oldLines = oldContent.split("\n");
    const newLines = newContent.split("\n");

    return [
      {
        oldStart: 1,
        oldCount: oldLines.length,
        newStart: 1,
        newCount: newLines.length,
        lines: this.computeDiff(oldLines, newLines),
      },
    ];
  }

  private computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
    const result: DiffLine[] = [];

    // Simple LCS-based diff (not optimal, but works for display)
    let i = 0,
      j = 0;

    while (i < oldLines.length && j < newLines.length) {
      if (oldLines[i] === newLines[j]) {
        result.push({
          type: "context",
          content: oldLines[i],
        });
        i++;
        j++;
      } else {
        result.push({
          type: "remove",
          content: oldLines[i],
        });
        i++;

        result.push({
          type: "add",
          content: newLines[j],
        });
        j++;
      }
    }

    // Add remaining lines
    while (i < oldLines.length) {
      result.push({
        type: "remove",
        content: oldLines[i],
      });
      i++;
    }

    while (j < newLines.length) {
      result.push({
        type: "add",
        content: newLines[j],
      });
      j++;
    }

    return result;
  }

  formatDiffForDisplay(diff: FileDiff): string {
    let output = `\n--- ${diff.file}\n`;
    output += `+++ ${diff.file}\n`;

    if (diff.hunks) {
      for (const hunk of diff.hunks) {
        output += `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@\n`;

        for (const line of hunk.lines) {
          const prefix =
            line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
          output += `${prefix}${line.content}\n`;
        }
      }
    }

    return output;
  }
}
