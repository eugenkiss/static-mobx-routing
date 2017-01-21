export class Colors {
  static primary = '#68b6ef'
  static background = '#EEE'
  static black = 'rgba(0,0,0,0.7)'
  static white = '#FFF'
  static red = '#D32A2A'
  static grey = '#E5E5E5'
  static greyLight = '#F5F5F5'
  static greyText = '#727272'
  static greyTextLight = '#CCCCCC'
  static greyDark = '#333'

  static opacity(hexcode: string, percent: number) {
    const rgb = hexToRgb(hexcode)
    return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + percent + ')'
  }
}

function hexToRgb(hexcode: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexcode)
  if (!result) return null
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

export class FontWeights {
  static light = 300
  static normal = 400
  static bold = 600
  static heavy = 700
  static black = 900
}

export class Sizes {
  static xxs = '0.236rem'
  static xs = '0.382rem'
  static s = '0.618rem'
  static m = '1rem'
  static l = '1.618rem'
  static xl = '2.618rem'
  static xxl = '6.854rem'
  static button = '14px'
  static title = '28px'
}
