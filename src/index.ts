import * as PIXI from 'pixi.js'
import * as _ from 'lodash'

const WIDTH = 650
const HEIGHT = 500
const FISH_SIZE = 50

const app = new PIXI.Application({
  height: HEIGHT,
  width: WIDTH,
  backgroundColor: 0xa7afbe,
  transparent: false,
})

type MySprite = PIXI.Sprite & {
  vx: number
  vy: number
  ax: number
  ay: number
  is_obj: boolean
}
const goldfishs: MySprite[] = []
let nuclear = null

const loader = new PIXI.Loader()
loader
  .add('goldfish', 'assets/goldfish.png')
  .add('nuclear', 'assets/nuclear.png')
  .on('progress', console.log)
  .load(() => {
    const goldfish_texture = loader.resources['goldfish'].texture
    const nuclear_texture = loader.resources['nuclear'].texture

    _.range(30).forEach(i => {
      let goldfish: any = new PIXI.Sprite(goldfish_texture)
      goldfish.position.set(_.random(20, 600), _.random(20, 400))
      goldfish.scale.set(0.08, 0.08)
      goldfish.anchor.set(0.5, 0.5)
      const deg = _.random(0, 2 * Math.PI, true)
      goldfish.vx = Math.sin(deg)
      goldfish.vy = Math.cos(deg)
      goldfish.ax = 0
      goldfish.ay = 0
      goldfish.is_obj = true
      app.stage.addChild(goldfish)

      goldfishs.push(goldfish)
    })
    nuclear = new PIXI.Sprite(nuclear_texture)
    nuclear.scale.set(0.05, 0.05)
    nuclear.anchor.set(0.5, 0.5)
    nuclear.vx = 0
    nuclear.vy = 0
    nuclear.is_obj = true
    goldfishs.push(nuclear) //! DANGER
    app.stage.addChild(nuclear)
    console.log(app.stage)
    app.ticker.add(delta => game_loop(delta))
  })

function length(x: number, y: number) {
  return Math.sqrt(x * x + y * y)
}
function vec_sub(u, v) {
  return [u.x - v.x, u.y - v.y]
}
function vec_distance(u, v) {
  return length(u.x - v.x, u.y - v.y)
}
function vec_normalize(v) {
  const len = length(v.x, v.y)
  return [v.x / len, v.y / len]
}
function limit(p, lim) {
  const len = length(p.x, p.y)
  const rat = len / lim
  return {
    x: rat > 1 ? p.x / rat : 0,
    y: rat > 1 ? p.y / rat : 0,
  }
}
function limit_length(x, y, len) {
  const ratio = length(x, y) / len
  return ratio > 1 ? [x / ratio, y / ratio] : [x, y]
}

function game_loop(delta) {
  const mouse = app.renderer.plugins.interaction.mouse.global
  nuclear.x = mouse.x
  nuclear.y = mouse.y
  for (const g of goldfishs) {
    if (g == nuclear) continue
    if (vec_distance(g, nuclear) < 100) {
      const [sub_x, sub_y] = vec_sub(g, nuclear)
      g.vx += sub_x * 1000
      g.vy += sub_y * 1000
      console.log('found')
    }
    const inner = _.filter(goldfishs, g2 => g2 != g && vec_distance(g, g2) < 60)
    const outer = _.filter(
      goldfishs,
      g2 => g2 != g && vec_distance(g, g2) < 100,
    )
    // Separation
    const [sepx, sepy] = _.transform(
      inner,
      ([sx, sy], fish) => {
        const [dx, dy] = vec_sub(g, fish)
        const dist = length(dx, dy)
        sx.push(dx / dist)
        sy.push(dy / dist)
      },
      [[], []],
    )
    const sep = limit(
      {
        x: _.mean(sepx) || 0,
        y: _.mean(sepy) || 0,
      },
      1,
    )

    // Alignment
    const align = limit(
      {
        x: _.meanBy(outer, f => f.vx) || 0,
        y: _.meanBy(outer, f => f.vy) || 0,
      },
      1,
    )

    // Cohesion
    const cohe = limit(
      {
        x: -g.x + (_.meanBy(outer, f => f.x) || 0),
        y: -g.y + (_.meanBy(outer, f => f.y) || 0),
      },
      1,
    )

    g.ax = _.clamp(g.ax - sep.x * 2.5 + align.x + cohe.x, 0, 5)
    g.ay = _.clamp(g.ay - sep.y * 2.5 + align.y + cohe.y, 0, 5)
    g.vx += g.ax
    g.vy += g.ay
    // if (_.random(0, 1, true) < 0.1) {
    //   g.vx += _.random(-0.1, 0.5, true)
    //   g.vy += _.random(-0.1, 0.5, true)
    // }
    g.vx = _.clamp(g.vx, 0, 3)
    g.vy = _.clamp(g.vy, 0, 3)
    g.ax = 0
    g.ay = 0
    // g.rotation = Math.atan2(g.vx, g.vy) + 0.5 * Math.PI
    g.x += g.vx
    g.y += g.vy

    if (g.y > HEIGHT + FISH_SIZE) g.y = -FISH_SIZE
    if (g.y < -FISH_SIZE) g.y = HEIGHT + FISH_SIZE
    if (g.x > WIDTH + FISH_SIZE) g.x = -FISH_SIZE
    if (g.y < -FISH_SIZE) g.x = WIDTH + FISH_SIZE

    // correct rotation
    const dir_deg = Math.atan2(g.vx, g.vy)
    const is_flip = 0 < dir_deg && dir_deg < Math.PI
    const rot_deg = -dir_deg + 1.5 * Math.PI
    g.scale.y = is_flip ? -Math.abs(g.scale.y) : Math.abs(g.scale.y)
    g.rotation = rot_deg
  }
}
// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view)

// load the texture we need
// app.loader.add('bunny', 'bunny.png').load((loader, resources) => {
//   // This creates a texture from a 'bunny.png' image
//   const bunny = new PIXI.Sprite(resources.bunny.texture)

//   // Setup the position of the bunny
//   bunny.x = app.renderer.width / 2
//   bunny.y = app.renderer.height / 2

//   // Rotate around the center
//   bunny.anchor.x = 0.5
//   bunny.anchor.y = 0.5

//   // Add the bunny to the scene we are building
//   app.stage.addChild(bunny)

//   // Listen for frame updates
//   app.ticker.add(() => {
//     // each frame we spin the bunny around a bit
//     bunny.rotation += 0.01
//   })
// })

// import * as $ from 'jquery'
// import * as _ from 'lodash'
// import * as p5 from 'p5'
// new p5.Vector(1, 2)
// class Flock {
//   boids = [] // Initialize the array
//   run() {
//     for (let i = 0; i < this.boids.length; i++) {
//       this.boids[i].run(this.boids) // Passing the entire list of boids to each boid individually
//     }
//   }
//   addBoid(b) {
//     this.boids.push(b)
//   }
// }

// class Boid {
//   acceleration: p5.Vector
//   velocity: p5.Vector
//   position: p5.Vector
//   r: number
//   maxspeed: number
//   maxforce: number

//   constructor(x, y) {
//     this.acceleration = new p5.Vector(0, 0)
//     this.velocity = new p5.Vector(_.random(-1, 1), _.random(-1, 1))
//     this.position = new p5.Vector(x, y)
//     this.r = 3.0
//     this.maxspeed = 3 // Maximum speed
//     this.maxforce = 0.05 // Maximum steering force
//   }

//   run(boids: Boid[], sketch: p5) {
//     this.flock(boids)
//     this.update()
//     this.borders()
//     this.render()
//   }

//   applyForce(force) {
//     // We could add mass here if we want A = F / M
//     this.acceleration.add(force)
//   }

//   // We accumulate a new acceleration each time based on three rules
//   flock(boids) {
//     let sep = this.separate(boids) // Separation
//     let ali = this.align(boids) // Alignment
//     let coh = this.cohesion(boids) // Cohesion
//     // Arbitrarily weight these forces
//     sep.mult(1.5)
//     ali.mult(1.0)
//     coh.mult(1.0)
//     // Add the force vectors to acceleration
//     this.applyForce(sep)
//     this.applyForce(ali)
//     this.applyForce(coh)
//   }

//   // Method to update location
//   updatefunction() {
//     // Update velocity
//     this.velocity.add(this.acceleration)
//     // Limit speed
//     this.velocity.limit(this.maxspeed)
//     this.position.add(this.velocity)
//     // Reset accelertion to 0 each cycle
//     this.acceleration.mult(0)
//   }

//   // A method that calculates and applies a steering force towards a target
//   // STEER = DESIRED MINUS VELOCITY
//   seek(target) {
//     let desired = p5.Vector.sub(target, this.position) // A vector pointing from the location to the target
//     // Normalize desired and scale to maximum speed
//     desired.normalize()
//     desired.mult(this.maxspeed)
//     // Steering = Desired minus Velocity
//     let steer = p5.Vector.sub(desired, this.velocity)
//     steer.limit(this.maxforce) // Limit to maximum steering force
//     return steer
//   }

//   renderfunction(sketch) {
//     // Draw a triangle rotated in the direction of velocity
//     let theta = this.velocity.heading() + sketch.radians(90)
//     sketch.fill(127)
//     sketch.stroke(200)
//     sketch.push()
//     sketch.translate(this.position.x, this.position.y)
//     sketch.rotate(theta)
//     sketch.beginShape()
//     sketch.vertex(0, -this.r * 2)
//     sketch.vertex(-this.r, this.r * 2)
//     sketch.vertex(this.r, this.r * 2)
//     sketch.endShape(sketch.CLOSE)
//     sketch.pop()
//   }

//   // Wraparound
//   borders() {
//     const WIDTH = 500
//     const HEIGHT = 500
//     if (this.position.x < -this.r) this.position.x = WIDTH + this.r
//     if (this.position.y < -this.r) this.position.y = HEIGHT + this.r
//     if (this.position.x > WIDTH + this.r) this.position.x = -this.r
//     if (this.position.y > HEIGHT + this.r) this.position.y = -this.r
//   }

//   // Separation
//   // Method checks for nearby boids and steers away
//   separate(boids) {
//     let desiredseparation = 25.0
//     // @ts-ignore
//     let steer = new p5.Vector(0, 0)
//     let count = 0
//     // For every boid in the system, check if it's too close
//     for (let i = 0; i < boids.length; i++) {
//       let d = p5.Vector.dist(this.position, boids[i].position)
//       // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
//       if (d > 0 && d < desiredseparation) {
//         // Calculate vector pointing away from neighbor
//         let diff = p5.Vector.sub(this.position, boids[i].position)
//         diff.normalize()
//         diff.div(d) // Weight by distance
//         steer.add(diff)
//         count++ // Keep track of how many
//       }
//     }
//     // Average -- divide by how many
//     if (count > 0) {
//       steer.div(count)
//     }

//     // As long as the vector is greater than 0
//     if (steer.mag() > 0) {
//       // Implement Reynolds: Steering = Desired - Velocity
//       steer.normalize()
//       steer.mult(this.maxspeed)
//       steer.sub(this.velocity)
//       steer.limit(this.maxforce)
//     }
//     return steer
//   }

//   // Alignment
//   // For every nearby boid in the system, calculate the average velocity
//   align(boids) {
//     let neighbordist = 50
//     // @ts-ignore
//     let sum = new p5.Vector(0, 0)
//     let count = 0
//     for (let i = 0; i < boids.length; i++) {
//       let d = p5.Vector.dist(this.position, boids[i].position)
//       if (d > 0 && d < neighbordist) {
//         sum.add(boids[i].velocity)
//         count++
//       }
//     }
//     if (count > 0) {
//       sum.div(count)
//       sum.normalize()
//       sum.mult(this.maxspeed)
//       let steer = p5.Vector.sub(sum, this.velocity)
//       steer.limit(this.maxforce)
//       return steer
//     } else {
//       // @ts-ignore
//       return new p5.Vector(0, 0)
//     }
//   }

//   // Cohesion
//   // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
//   cohesion(boids) {
//     let neighbordist = 50
//     // @ts-ignore
//     let sum = new p5.Vector(0, 0) // Start with empty vector to accumulate all locations
//     let count = 0
//     for (let i = 0; i < boids.length; i++) {
//       let d = p5.Vector.dist(this.position, boids[i].position)
//       if (d > 0 && d < neighbordist) {
//         sum.add(boids[i].position) // Add location
//         count++
//       }
//     }
//     if (count > 0) {
//       sum.div(count)
//       return this.seek(sum) // Steer towards the location
//     } else {
//       // @ts-ignore
//       return new p5.Vector(0, 0)
//     }
//   }
// }

// var s = function(sketch: p5) {
//   let flock = new Flock()

//   sketch.setup = function setup() {
//     sketch.createCanvas(640, 360)
//     sketch.createP('Drag the mouse to generate new boids.')
//     for (let i = 0; i < 100; i++) {
//       let b = new Boid(sketch.width / 2, sketch.height / 2)
//       flock.addBoid(b)
//     }
//   }

//   sketch.draw = function draw() {
//     sketch.background(51)
//     flock.run()
//   }

//   // Add a new boid into the System
//   sketch.mouseDragged = function mouseDragged() {
//     flock.addBoid(new Boid(this.mouseX, this.mouseY))
//   }

//   // The Nature of Code
//   // Daniel Shiffman
//   // http://natureofcode.com

//   // Flock object
//   // Does very little, simply manages the array of all the boids

//   // The Nature of Code
//   // Daniel Shiffman
//   // http://natureofcode.com

//   // Boid class
//   // Methods for Separation, Cohesion, Alignment added
// }

// $().ready(() => {
//   var myp5 = new p5(s, document.getElementById('p5-wrapper'))
// })
