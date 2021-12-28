import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import Stats from 'stats.js'

import circleLineVertexShader from './shaders/circleLineEqualizer/vertex.glsl'
import circleLineFragmentShader from './shaders/circleLineEqualizer/fragment.glsl'

import lineVertexShader from './shaders/lineEqualizer/vertex.glsl'
import lineFragmentShader from './shaders/lineEqualizer/fragment.glsl'

import { mutateData } from './helpers'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('#webgl')

// Scene
const scene = new THREE.Scene()

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-.7, -.5, 2.8)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.autoRotate = false
controls.autoRotateSpeed = .3

gui.add(controls, 'autoRotate').listen()

// Clock
const clock = new THREE.Clock()

// Stats
const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

// Audio
const audio = document.querySelector('#music')
const audioCtx = new AudioContext()
const analyser = audioCtx.createAnalyser()
const audioSrc = audioCtx.createMediaElementSource(audio)
audioSrc.connect(analyser)
analyser.connect(audioCtx.destination)
analyser.fftSize = 4096 // max 32768 

// Listeners

window.addEventListener('touchstart', () => {
  audioCtx.resume()
  audio.play()
})

const btns = document.querySelectorAll('.controls button')
let activeAudio = 0

btns.forEach(btn => {
  btn.addEventListener('click', e => {
    e.currentTarget.blur()

    audio.pause()
    audioCtx.resume()

    if (e.currentTarget.id === 'track1' && activeAudio !== 0) {
      audio.src = 'mp3/quest.mp3'
      activeAudio = 0
    } else if (e.currentTarget.id === 'track2' && activeAudio !== 1) {
      audio.src = 'mp3/nosaj-thing-ioio.mp3'
      activeAudio = 1
    } else if (e.currentTarget.id === 'track3' && activeAudio !== 2) {
      audio.src = 'mp3/nosaj-thing-nightcrawler.mp3'
      activeAudio = 2
    } else if (e.currentTarget.id === 'track4' && activeAudio !== 3) {
      audio.src = '/mp3/track1.mp3'
      activeAudio = 3
    } else if (e.currentTarget.id === 'track5' && activeAudio !== 4) {
      audio.src = 'mp3/todd-terje-inspector-norse.mp3'
      activeAudio = 4
    }

    audio.load()
    audio.play()
  })
})

audio.addEventListener('pause', () => {
  controls.autoRotate = false
  btns.forEach(btn => btn.classList.remove('active'))
})

audio.addEventListener('play', () => {
  controls.autoRotate = true
  updateBtns()
})

function updateBtns() {
  btns.forEach(btn => {
    if (btn.id === `track${activeAudio + 1}`) {
      btn.classList.add('active')
    } else {
      btn.classList.remove('active')
    }
  })
}

let preset

const bufferLength = analyser.frequencyBinCount
const fbcArray = new Uint8Array(bufferLength)

/**
 * Parameters
 */
const parameters = {
  barsCount: 160,
  barsScaleX: 5,
  barsScaleY: 1,
  barsRadius: 1.37,
  barsStrength: 1,
  lineVertexsCount: 160,
  lineOuterRadius: .87,
  lineInnerRadius: .84,
  lineRadius: 1,
  lineStrength: 0.001,
  lineShrinkRatio: 1,
  pointsCols: 25,
  pointsRows: 22,
  pointsOffsetX: .15,
  pointsOffsetY: .15,
  pointsDelay: .016,
  pointsSize: 0.1,
  pointsStrength: -1,
  bloomStrength: 0.36,
  bloomThreshold: 0.06,
  bloomRadius: 0,
  bloomActive: innerWidth > 768,
  savePreset() {
    preset = gui.save()
    loadButton.enable()
  },
  loadPreset() {
    gui.load(preset)
  }
}

gui.add(parameters, 'savePreset')
const loadButton = gui.add(parameters, 'loadPreset').disable()

/**
 * Bars equalizer
 */
// Geometry
const barsEqualizerGeometry = new THREE.PlaneGeometry(.005, .5, 1, 1)
  // const geometry = new THREE.BoxGeometry(0.005, .5, .1, 1, 1, 1)

// Create Equalizer Bars

const barEqualizer = new THREE.Group()
barEqualizer.rotation.z = Math.PI * .5
scene.add(barEqualizer)

function createBarsEqualizer() {
  if (barEqualizer.children.length) {
    barEqualizer.clear()
  }

  for (let i = 0; i < parameters.barsCount; i++) {
    const angle = i * Math.PI * 2 / parameters.barsCount
    const x = Math.cos(angle) * parameters.barsRadius
    const y = Math.sin(angle) * parameters.barsRadius
    const color = new THREE.Color(`hsl(${angle * 180 / Math.PI}, 100%, 55%)`)

    const mesh = new THREE.Mesh(
      barsEqualizerGeometry,
      // new THREE.ShaderMaterial({
      //   vertexShader,
      //   fragmentShader,
      //   side: THREE.DoubleSide,
      //   uniforms: {
      //     uColor: { value: color }
      //   }
      // })
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color,
        side: THREE.DoubleSide
      })
    )

    mesh.rotation.z = angle - Math.PI * .5
    mesh.position.x = x
    mesh.position.y = y

    barEqualizer.add(mesh)
  }
}

createBarsEqualizer()

// gui

const barsFolder = gui.addFolder('bars circle')
barsFolder.add(parameters, 'barsCount').min(50).max(500).step(1).onFinishChange(createBarsEqualizer).name('count')
barsFolder.add(parameters, 'barsScaleX').min(.1).max(20).step(.001).name('scaleX')
barsFolder.add(parameters, 'barsScaleY').min(.1).max(20).step(.001).name('scaleY')
barsFolder.add(parameters, 'barsRadius').min(.1).max(2).step(.001).name('radius').onFinishChange(createBarsEqualizer)
barsFolder.add(parameters, 'barsStrength').min(.1).max(1).step(.001).name('strength')
barsFolder.add(barEqualizer, 'visible')
barsFolder.close()

if (innerWidth < 768) {
  barsFolder.close()
}

// Update Equalizer Bars

function updateBarsEqualizer() {
  const { barsCount, barsScaleX, barsScaleY, barsStrength } = parameters
  let data = fbcArray

  const frequencyRange = (activeAudio === 4 && false) ? 'midrange ' : 'oldMids'

  data = mutateData(data, "organize")[frequencyRange]
  data = mutateData(data, "split", 2)[0]
  data = mutateData(data, "shrink", barsCount)
  data = mutateData(data, "mirror")
  data = mutateData(data, "scale", 100)
  data = mutateData(data, "amp", .75)

  for (let i = 0; i < data.length; i++) {
    const child = barEqualizer.children[i]
    if (child) {
      child.scale.x = barsScaleX
      child.scale.y = Math.max(data[i] * 0.01 * barsStrength, .1) * barsScaleY
    }
  }
}

/**
 * Line Equalizer
 */

const circleLineEqualizer = new THREE.Group()
circleLineEqualizer.rotation.z = Math.PI * .5
circleLineEqualizer.position.z = -0.2
scene.add(circleLineEqualizer)

function createCircleLineEqualizer() {
  if (circleLineEqualizer.children.length) {
    circleLineEqualizer.clear()
  }

  const { lineInnerRadius, lineOuterRadius, lineVertexsCount, lineStrength } = parameters
  const geometry = new THREE.RingGeometry(lineInnerRadius, lineOuterRadius, lineVertexsCount - 1)
  const material = new THREE.ShaderMaterial({
    vertexShader: circleLineVertexShader,
    fragmentShader: circleLineFragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color('white') },
      uStrength: { value: lineStrength }
    },
    wireframe: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })

  const count = geometry.attributes.position.count
  const frequencies = new Float32Array(count * 2)

  for (let i = 0; i < frequencies.length; i++) {
    frequencies[i] = 0
  }

  geometry.setAttribute('aFrequency', new THREE.BufferAttribute(frequencies, 1))

  const mesh = new THREE.Mesh(geometry, material)
  circleLineEqualizer.add(mesh)
}

createCircleLineEqualizer()

function updateCircleLineEqualizer() {
  const mesh = circleLineEqualizer.children[0]
  const aFrequency = mesh.geometry.attributes.aFrequency
  const { lineVertexsCount, lineShrinkRatio } = parameters
  let data = fbcArray

  data = mutateData(data, "organize").oldHigherMidrange
  data = mutateData(data, "split", 2)[0]
  data = mutateData(data, "shrink", lineVertexsCount)
  data = mutateData(data, "mirror")
  data = mutateData(data, "scale", 100)
  data = mutateData(data, "amp", .75)

  for (let i = 0; i < lineVertexsCount; i++) {
    // innerCircle - coords are inverted and minored
    aFrequency.array[i] = -data[i] * .2

    // outer circle - we add 'lineVertexsCount' because of vertexs buffer sort method
    // (First the inner circle vertexs, second the outer circle vertexs)
    aFrequency.array[i + lineVertexsCount] = data[i]
  }

  aFrequency.needsUpdate = true

  const scale = 1 - data[50] * .001 * lineShrinkRatio
  circleLineEqualizer.scale.set(scale, scale, scale)
}

const circleLineFolder = gui.addFolder('line circle')
circleLineFolder.add(circleLineEqualizer, 'visible')
circleLineFolder.add(parameters, 'lineVertexsCount').min(52).max(850).step(1).name('vertexs').onFinishChange(createCircleLineEqualizer)
circleLineFolder.add(parameters, 'lineOuterRadius').min(0.1).max(3).step(0.001).name('outerRadius').onFinishChange(createCircleLineEqualizer)
circleLineFolder.add(parameters, 'lineInnerRadius').min(0.1).max(3).step(0.001).name('innerRadius').onFinishChange(createCircleLineEqualizer)
circleLineFolder.add(parameters, 'lineShrinkRatio').min(-10).max(10).step(0.01).name('shrink')
circleLineFolder.add(parameters, 'lineStrength').min(0.0001).max(0.01).step(0.001).name('strenght').onFinishChange(value => {
  circleLineEqualizer.children[0].material.uniforms.uStrength.value = value
})
circleLineFolder.close()

/**
 * Points Equalizer
 */

const pointsEqualizer = new THREE.Group()
pointsEqualizer.position.z = -1
scene.add(pointsEqualizer)

function createPointsEqualizer() {
  if (pointsEqualizer.children.length) {
    pointsEqualizer.clear()
  }

  const { pointsCols, pointsRows, pointsOffsetX, pointsOffsetY } = parameters
  const pointsCount = pointsCols * pointsRows

  const geometry = new THREE.BufferGeometry()
  const material = new THREE.PointsMaterial({
    sizeAttenuation: true,
    size: .01
  })

  const position = new Float32Array(pointsCount * 3)

  for (let i = 0; i < pointsCount; i++) {
    const x = i % pointsCols
    const y = (i - x) / pointsCols
    const i3 = i * 3
    const centerX = (pointsCols - 1) / 2 * pointsOffsetX
    const centerY = (pointsRows - 1) / 2 * pointsOffsetY

    position[i3] = x * pointsOffsetX - centerX
    position[i3 + 1] = y * pointsOffsetY - centerY
    position[i3 + 2] = 0
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))

  const points = new THREE.Points(geometry, material)
  pointsEqualizer.add(points)
}

createPointsEqualizer()

let oldDatas = []
let currentData, prevData

function updatePointsEqualize() {
  const { pointsCols, pointsRows, pointsDelay, pointsStrength } = parameters
  const mesh = pointsEqualizer.children[0]
  const elpased = clock.getElapsedTime()
  let data = fbcArray

  // console.log(pointsRows)

  // data = mutateData(data, "organize").mids
  data = mutateData(data, "split", 2)[0]
  data = mutateData(data, "shrink", pointsRows)
  data = mutateData(data, "mirror-inversed")
  data = mutateData(data, "scale", 100)
  data = mutateData(data, "amp", .75)

  currentData = {
    data,
    timestamp: elpased
  }

  // Fill and update data array
  if (prevData) {
    const delta = currentData.timestamp - prevData.timestamp

    if (delta > pointsDelay) {
      oldDatas.unshift(currentData)
      prevData = currentData

      if (oldDatas.length > Math.floor(pointsCols / 2)) {
        oldDatas.pop()
      }
    }
  } else {
    prevData = currentData
  }

  // Update center column
  updateCol(Math.floor(pointsCols / 2), data)

  oldDatas.forEach((oldData, i) => {
    updateCol(Math.floor(pointsCols / 2) + (i + 1), oldData.data)
    updateCol(Math.floor(pointsCols / 2) - (i + 1), oldData.data)
  })

  function updateCol(start, frequencies) {
    let ii = 0
    for (let i = start; i < pointsRows * pointsCols; i += pointsCols) {
      const i3 = i * 3
      mesh.geometry.attributes.position.array[i3 + 2] = frequencies[ii] * .004 * pointsStrength
      ii++
    }
  }

  mesh.geometry.attributes.position.needsUpdate = true
}

const pointsFolder = gui.addFolder('points grid')
pointsFolder.add(parameters, 'pointsCols').min(1).max(500).step(2).onFinishChange(value => {
  parameters.pointsCols = value + 1
  createPointsEqualizer()
}).name('cols')
pointsFolder.add(parameters, 'pointsRows').min(1).max(500).step(1).onFinishChange(value => {
  parameters.pointsRows = value + 1
  createPointsEqualizer()
}).name('rows')
pointsFolder.add(parameters, 'pointsOffsetX').min(.01).max(0.15).step(.001).onFinishChange(createPointsEqualizer).name('offsetX')
pointsFolder.add(parameters, 'pointsOffsetY').min(.01).max(0.15).step(.001).onFinishChange(createPointsEqualizer).name('offsetY')
pointsFolder.add(parameters, 'pointsDelay').min(.016).max(.096).step(.001).name('delay')
pointsFolder.add(parameters, 'pointsStrength').min(-5).max(5).step(.001).name('strength')
pointsFolder.add(parameters, 'pointsSize').min(.01).max(.06).step(.001).onFinishChange(value => {
  pointsEqualizer.children[0].material.size = value
}).name('size')
pointsFolder.close()

/**
 * Line Equalizer
 */

const lineEqualizer = new THREE.Group()
lineEqualizer.rotation.x = Math.PI / 2
scene.add(lineEqualizer)

function createLineEqualizer() {
  const geometry = new THREE.CylinderGeometry(.1, .1, 10, 10, 500)
  const material = new THREE.ShaderMaterial({
    fragmentShader: lineFragmentShader,
    vertexShader: lineVertexShader,
    wireframe: true
  })
  const mesh = new THREE.Mesh(geometry, material)
  const len = geometry.attributes.position.count
  const strength = new Float32Array(len)

  for (let i = 0; i < len; i++) {
    const i3 = i * 3
    const rand = Math.random()
    for (let ii = 0; ii < 10; ii++) {
      // strength[ii * 3 + i3] = rand
    }
  }

  geometry.setAttribute('aStrength', new THREE.BufferAttribute(strength, 1))

  geometry.attributes.aStrength.needsUpdate = true

  lineEqualizer.add(mesh)
}

// createLineEqualizer()

// Listeners

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.setSize(sizes.width, sizes.height)

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
})

window.addEventListener('keydown', e => {
  if (e.keyCode === 32) {
    audioCtx.resume()
    audio[audio.paused ? 'play' : 'pause']()
  }
})


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})

renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Effect composer
 */
const renderScene = new RenderPass(scene, camera)

const ssaaRenderPass = new SSAARenderPass(scene, camera)
ssaaRenderPass.sampleLevel = 32
ssaaRenderPass.unbiased = true

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(innerWidth * devicePixelRatio, innerHeight * devicePixelRatio),
  parameters.bloomStrength,
  parameters.bloomRadius,
  parameters.bloomThreshold
)

// Composer
const composer = new EffectComposer(renderer)
composer.addPass(renderScene)
composer.addPass(ssaaRenderPass)
composer.addPass(bloomPass)

const updateBloom = () => {
  bloomPass.threshold = parameters.bloomThreshold
  bloomPass.radius = parameters.bloomRadius
  bloomPass.strength = parameters.bloomStrength
}

const bloomFolder = gui.addFolder('bloom effect')
bloomFolder.add(parameters, 'bloomActive').name('active')
bloomFolder.add(parameters, 'bloomStrength').min(0).max(10).step(.01).name('strength').onChange(updateBloom)
bloomFolder.add(parameters, 'bloomThreshold').min(0).max(1).step(.001).name('threshold').onChange(updateBloom)
bloomFolder.add(parameters, 'bloomRadius').min(0).max(1).step(.001).name('radius').onChange(updateBloom)
bloomFolder.close()

if (innerWidth < 768) {
  bloomFolder.close()
}

/**
 * Animate
 */

const tick = () => {
  stats.begin()

  // Update controls
  controls.update()

  // Update frequencies data
  analyser.getByteFrequencyData(fbcArray)

  // Update equalizers
  updateBarsEqualizer()
  updateCircleLineEqualizer()
  updatePointsEqualize()

  // Render
  if (!parameters.bloomActive) {
    renderer.render(scene, camera)
  } else {
    composer.render()
  }

  stats.end()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}


tick()