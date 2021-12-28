const mutateData = (data, type, extra = null) => {
  if (type === "mirror") {
    let rtn = []

    for (let i = 0; i < data.length; i += 2) {
      rtn.push(data[i])
    }

    rtn = [...rtn, ...rtn.reverse()]
    return rtn
  }

  if (type === "mirror-inversed") {
    let rtn = []
    let rtnCopy

    for (let i = 0; i < data.length; i += 2) {
      rtn.push(data[i])
    }

    rtnCopy = rtn.slice()

    rtn = [...rtnCopy.reverse(), ...rtn]
    return rtn
  }

  if (type === "shrink") {
    //resize array by % of current array 
    if (extra < 1) {
      extra = data.length * extra
    }

    let rtn = []
    let splitAt = Math.floor(data.length / extra)

    for (let i = 1; i <= extra; i++) {
      let arraySection = data.slice(i * splitAt, (i * splitAt) + splitAt)

      let middle = arraySection[Math.floor(arraySection.length / 2)]
      rtn.push(middle)
    }

    return rtn
  }

  if (type === "split") {
    let size = Math.floor(data.length / extra)
    let rtn = []
    let temp = []

    let track = 0
    for (let i = 0; i <= size * extra; i++) {
      if (track === size) {
        rtn.push(temp)
        temp = []
        track = 0
      }

      temp.push(data[i])
      track++
    }

    return rtn
  }

  if (type === "scale") {
    let scalePercent = extra / 255
    if (extra <= 3 && extra >= 0) scalePercent = extra
    let rtn = data.map(value => value * scalePercent)
    return rtn
  }

  if (type === "organize") {
    let rtn = {}
      // rtn.bass = data.slice(60, 600)
      // rtn.vocals = data.slice(120, 255)
      // rtn.mids = data.slice(255, 2000)
      // rtn.higherMidRange = data.slice(2000, 4000)

    // 0 to 22 000 Hz (frequency band)
    // sub-bass : 16 to 60 Hz
    // bass : 60 to 250 Hz
    // Lower Midrange : 250 to 500 Hz
    // MidRange: 500 to 2 kHz
    // Higher Midrange: 2 to 4 kHz
    // Presence : 4 to 6 kHz
    // Brillance : 6 to 20 kHz

    function toHertz(value) {
      const hertz = data.length / 22050
      return Math.round(value * hertz)
    }

    // rtn.bass = data.slice(toHertz(60), toHertz(120))
    // rtn.vocals = data.slice(toHertz(120), toHertz(255))
    // rtn.mids = data.slice(toHertz(255), toHertz(2000))
    // rtn.higherMidRange = data.slice(toHertz(2000), toHertz(4000))

    rtn.subBass = data.slice(toHertz(16), toHertz(60))
    rtn.bass = data.slice(toHertz(60), toHertz(250))
    rtn.lowerMidrange = data.slice(toHertz(250), toHertz(500))
    rtn.midrange = data.slice(toHertz(500), toHertz(2000))
    rtn.higherMidrange = data.slice(toHertz(2000), toHertz(4000))
    rtn.mids = data.slice(toHertz(250), toHertz(2000))
    rtn.oldMids = data.slice(
      Math.round(255 / 2048 * data.length),
      Math.round(2000 / 2048 * data.length)
    )
    rtn.oldHigherMidrange = data.slice(
      Math.round(0 / 2048 * data.length),
      Math.round(1700 / 2048 * data.length)
    )
    rtn.presence = data.slice(toHertz(4000), toHertz(6000))
    rtn.brillance = data.slice(toHertz(6000), toHertz(20000))

    return rtn
  }

  if (type === "reverb") {
    let rtn = []
    data.forEach((val, i) => {
      rtn.push(val - (data[i + 1] || 0))
    })
    return rtn
  }

  if (type === "amp") {
    let rtn = []
    data.forEach(val => {
      rtn.push(val * (extra + 1))
    })
    return rtn
  }

  if (type === "min") {
    let rtn = []
    data.forEach(value => {
      if (value < extra) value = extra
      rtn.push(value)
    })
    return rtn
  }
}

export { mutateData }