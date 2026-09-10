/**
 * Safe AST-based Mathematical Formula Evaluator for Custom Satellite Vegetation Indices.
 * Strictly avoids eval() or new Function().
 * Allowed Variables: NIR, RED, GREEN, BLUE, REDEDGE, SWIR1, SWIR2
 * Allowed Operators: +, -, *, /, (, ) and numbers/decimals
 */

export interface BandValues {
  NIR: number
  RED: number
  GREEN: number
  BLUE: number
  REDEDGE: number
  SWIR1: number
  SWIR2: number
  [key: string]: number
}

export interface FormulaValidationResult {
  isValid: boolean
  error?: string
  requiredBands: string[]
}

const ALLOWED_BANDS = ['NIR', 'RED', 'GREEN', 'BLUE', 'REDEDGE', 'SWIR1', 'SWIR2']

export function validateFormula(formula: string): FormulaValidationResult {
  if (!formula || typeof formula !== 'string' || formula.trim().length === 0) {
    return { isValid: false, error: 'Formül boş olamaz', requiredBands: [] }
  }

  const cleaned = formula.trim()

  // Character safety check
  const invalidCharMatch = cleaned.match(/[^a-zA-Z0-9\s\+\-\*\/\(\)\.]/)
  if (invalidCharMatch) {
    return {
      isValid: false,
      error: `Geçersiz karakter tespit edildi: "${invalidCharMatch[0]}"`,
      requiredBands: [],
    }
  }

  // Tokenize
  const tokens = tokenize(cleaned)
  if (tokens.length === 0) {
    return { isValid: false, error: 'Geçerli token bulunamadı', requiredBands: [] }
  }

  // Find all variable names
  const bandsFound = new Set<string>()
  for (const token of tokens) {
    if (/^[a-zA-Z]+$/.test(token)) {
      const upper = token.toUpperCase()
      if (!ALLOWED_BANDS.includes(upper)) {
        return {
          isValid: false,
          error: `Bilinmeyen spektral bant: "${token}". Desteklenenler: ${ALLOWED_BANDS.join(', ')}`,
          requiredBands: [],
        }
      }
      bandsFound.add(upper)
    }
  }

  if (bandsFound.size === 0) {
    return {
      isValid: false,
      error: 'Formül en az bir spektral bant içermelidir (örn: NIR, RED)',
      requiredBands: [],
    }
  }

  // Parentheses balance check
  let balance = 0
  for (const token of tokens) {
    if (token === '(') balance++
    if (token === ')') balance--
    if (balance < 0) {
      return { isValid: false, error: 'Parantez kapanışında hata var', requiredBands: [] }
    }
  }
  if (balance !== 0) {
    return { isValid: false, error: 'Açık kalan parantez mevcut', requiredBands: [] }
  }

  // Test evaluation with sample band values
  const sampleBands: BandValues = {
    NIR: 0.8,
    RED: 0.15,
    GREEN: 0.2,
    BLUE: 0.1,
    REDEDGE: 0.35,
    SWIR1: 0.25,
    SWIR2: 0.18,
  }

  try {
    const result = evaluateFormula(cleaned, sampleBands)
    if (typeof result !== 'number' || isNaN(result)) {
      return { isValid: false, error: 'Formül sayısal bir sonuç üretmedi', requiredBands: [] }
    }
  } catch (err: any) {
    return { isValid: false, error: `Formül hatası: ${err?.message || 'Geçersiz sözdizimi'}`, requiredBands: [] }
  }

  return {
    isValid: true,
    requiredBands: Array.from(bandsFound),
  }
}

export function tokenize(expr: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }

    if (['+', '-', '*', '/', '(', ')'].includes(ch)) {
      tokens.push(ch)
      i++
      continue
    }

    // Number or decimal
    if (/[0-9\.]/.test(ch)) {
      let num = ''
      while (i < expr.length && /[0-9\.]/.test(expr[i])) {
        num += expr[i]
        i++
      }
      tokens.push(num)
      continue
    }

    // Identifier (Band name)
    if (/[a-zA-Z]/.test(ch)) {
      let id = ''
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        id += expr[i]
        i++
      }
      tokens.push(id)
      continue
    }

    i++
  }
  return tokens
}

/**
 * Shunting-Yard Algorithm to convert Infix to Postfix (Reverse Polish Notation)
 */
function toRpn(tokens: string[]): string[] {
  const output: string[] = []
  const ops: string[] = []

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    // Number or Band Identifier
    if (!['+', '-', '*', '/', '(', ')'].includes(token)) {
      output.push(token)
    } else if (token === '(') {
      ops.push(token)
    } else if (token === ')') {
      while (ops.length > 0 && ops[ops.length - 1] !== '(') {
        output.push(ops.pop()!)
      }
      ops.pop() // remove '('
    } else {
      // Operator
      const p = precedence[token] || 0
      while (ops.length > 0 && ops[ops.length - 1] !== '(' && (precedence[ops[ops.length - 1]] || 0) >= p) {
        output.push(ops.pop()!)
      }
      ops.push(token)
    }
  }

  while (ops.length > 0) {
    output.push(ops.pop()!)
  }

  return output
}

/**
 * Evaluates a mathematical formula with given band reflectance values
 */
export function evaluateFormula(formula: string, bands: BandValues): number {
  const tokens = tokenize(formula)
  if (tokens.length === 0) return 0

  const rpn = toRpn(tokens)
  const stack: number[] = []

  for (const token of rpn) {
    if (!['+', '-', '*', '/'].includes(token)) {
      // Number or Variable
      const upper = token.toUpperCase()
      if (ALLOWED_BANDS.includes(upper)) {
        const val = bands[upper] !== undefined ? bands[upper] : (bands[token] || 0)
        stack.push(val)
      } else {
        const num = parseFloat(token)
        if (isNaN(num)) {
          throw new Error(`Geçersiz sayı veya bant: ${token}`)
        }
        stack.push(num)
      }
    } else {
      // Operator
      if (stack.length < 2) {
        throw new Error('Yetersiz terim')
      }
      const b = stack.pop()!
      const a = stack.pop()!

      let res = 0
      switch (token) {
        case '+':
          res = a + b
          break
        case '-':
          res = a - b
          break
        case '*':
          res = a * b
          break
        case '/':
          res = b === 0 ? 0 : a / b
          break
      }
      stack.push(res)
    }
  }

  if (stack.length !== 1) {
    throw new Error('Sözdizim hatası: ifade çözümlenemedi')
  }

  const finalVal = stack[0]
  return Math.round(finalVal * 1000) / 1000
}

/**
 * Pre-seeded Popular Agronomic Custom Indices for quick selection
 */
export const PRESET_CUSTOM_INDICES = [
  {
    code: 'GNDVI',
    name: 'Yeşil Normalize Edilmiş Bitki İndeksi (GNDVI)',
    description: 'Klorofil konsantrasyonunu yeşil bantla hassas tespit eder. Üst gübreleme ve su baskınlarında etkilidir.',
    formula: '(NIR - GREEN) / (NIR + GREEN)',
    requiredBands: ['NIR', 'GREEN'],
    valueMin: -1,
    valueMax: 1,
    colorRamp: [
      { value: 0.15, color: '#d73027', label: 'Çok Düşük / Stresli' },
      { value: 0.45, color: '#fee08b', label: 'Orta Düzey Klorofil' },
      { value: 0.75, color: '#1a9850', label: 'Yüksek Klorofil / Canlı' },
    ],
  },
  {
    code: 'EVI2',
    name: 'Gelişmiş Vejetasyon İndeksi 2 (EVI2)',
    description: 'Yüksek biyokütlede doyuma ulaşmayan, mavi bantsız optimize edilmiş atmosfer düzeltmeli indeks.',
    formula: '2.5 * (NIR - RED) / (NIR + 2.4 * RED + 1)',
    requiredBands: ['NIR', 'RED'],
    valueMin: 0,
    valueMax: 1,
    colorRamp: [
      { value: 0.1, color: '#d73027', label: 'Zayıf Örtü' },
      { value: 0.35, color: '#fee08b', label: 'Normal Gelişme' },
      { value: 0.65, color: '#1a9850', label: 'Yoğun Biyokütle' },
    ],
  },
  {
    code: 'SAVI',
    name: 'Toprak Düzeltmeli Bitki İndeksi (SAVI L=0.5)',
    description: 'Seyrek ekimlerde toprak zemin yansımasını normalize eden klasik agronomik formül.',
    formula: '1.5 * (NIR - RED) / (NIR + RED + 0.5)',
    requiredBands: ['NIR', 'RED'],
    valueMin: -1,
    valueMax: 1,
    colorRamp: [
      { value: 0.1, color: '#d73027', label: 'Toprak Baskın' },
      { value: 0.3, color: '#fee08b', label: 'Kısmi Örtü' },
      { value: 0.6, color: '#1a9850', label: 'Tam Kapama' },
    ],
  },
  {
    code: 'CVI',
    name: 'Klorofil Vejetasyon İndeksi (CVI)',
    description: 'Azot dozu ve klorofil durumunun yaprak yüzeyinde ayrıştırılmasında kullanılır.',
    formula: '(NIR * RED) / (GREEN * GREEN)',
    requiredBands: ['NIR', 'RED', 'GREEN'],
    valueMin: 0,
    valueMax: 8,
    colorRamp: [
      { value: 1.0, color: '#d73027', label: 'Azot Eksikliği' },
      { value: 3.0, color: '#fee08b', label: 'Optimum Azot' },
      { value: 6.0, color: '#1a9850', label: 'Yüksek Azot' },
    ],
  },
]
