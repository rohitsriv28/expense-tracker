export function evaluateMathExpression(input: string): number | null {
  if (!/^[\d+\-*/.() ]+$/.test(input)) return null;

  const expr = input.replace(/\s+/g, "");
  if (!expr) return null;

  let pos = 0;

  function parseExpression(): number {
    let result = parseTerm();
    while (pos < expr.length) {
      const char = expr[pos];
      if (char === "+") {
        pos++;
        result += parseTerm();
      } else if (char === "-") {
        pos++;
        result -= parseTerm();
      } else {
        break;
      }
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < expr.length) {
      const char = expr[pos];
      if (char === "*") {
        pos++;
        result *= parseFactor();
      } else if (char === "/") {
        pos++;
        const denominator = parseFactor();
        if (denominator === 0) throw new Error("Division by zero");
        result /= denominator;
      } else {
        break;
      }
    }
    return result;
  }

  function parseFactor(): number {
    if (pos >= expr.length) throw new Error("Unexpected end of expression");

    const char = expr[pos];

    if (char === "+") {
      pos++;
      return parseFactor();
    }
    if (char === "-") {
      pos++;
      return -parseFactor();
    }

    if (char === "(") {
      pos++;
      const result = parseExpression();
      if (pos >= expr.length || expr[pos] !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      pos++; // consume ')'
      return result;
    }

    const startPos = pos;
    let dotCount = 0;
    while (
      pos < expr.length &&
      (/[0-9]/.test(expr[pos]) || expr[pos] === ".")
    ) {
      if (expr[pos] === ".") dotCount++;
      if (dotCount > 1) throw new Error("Multiple decimal points");
      pos++;
    }

    if (startPos === pos) {
      throw new Error("Unexpected character");
    }

    const numStr = expr.substring(startPos, pos);
    if (numStr === ".") throw new Error("Invalid number");

    return parseFloat(numStr);
  }

  try {
    const result = parseExpression();
    if (pos < expr.length) {
      return null;
    }
    if (!Number.isFinite(result) || result < 0) {
      return null;
    }
    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}
