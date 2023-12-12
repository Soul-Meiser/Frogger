const CANVASX = 400;
const CANVASY = 400;
const WINZONE = 30;
const STARTX = 190;
const STARTY = 370;

function setup() {
  createCanvas(CANVASX, CANVASY);
  frog = new Player();
  laneList = createLevel(0);
}

function createBoxes(lives,score,level,wins) {
  // prepare a box first
  strokeWeight(4);
  fill('rgba(244,75,12,0.25)')
  var boxHeight = 30
  var boxWidth = 120
  rect(0, 0, boxWidth, boxHeight);
  rect(CANVASX-(boxWidth), 0, boxWidth, boxHeight);
  rect(CANVASX/2 - boxWidth/2, 0, boxWidth, boxHeight);
  
  
  textSize(20);           // size of the text (pixels)
  fill(0, 102, 153);      // fill() takes R,G,B values as the color
  // draw the text in the box (x,y,width,height) with the color in fill()
  textAlign(CENTER);
  //Midway accounting for text being bottom aligned
  text(`Lives: ${lives}`, boxWidth/2, boxHeight/2+7);
  text(`Score: ${score}`, CANVASX-boxWidth/2, boxHeight/2+7);
  text(`Level: ${level+1}.${wins*2}`, CANVASX/2, boxHeight/2+7);
  
  //Pond at the top of the screen
  strokeWeight(2);
  fill('rgba(12,244,140,0.25)')
  rect(0,boxHeight,400,20)
  
}

function createLevel(level_difficulty) {
  //creates all the lanes and returns the laneList. as the level increases, so does the speed, number of lanes, and max cars.
  var laneY = 350;
  var direction = true;
  var speed = 1;
  var maxCars = 1;
  laneList = [];
  for(let i = 0; i < 16; i++)
    {
      if(random() <= 0.25 + (level_difficulty*0.1)) {
        if(randomGaussian() < 0) {direction = false}
        speed = floor(random(3,6)+level_difficulty*0.5);
        if(speed > 9) {speed = 9;}
        maxCars = floor(random(1,5)+level_difficulty*0.5);
        if(maxCars > 9) {maxCars = 9;}
        laneList[laneList.length] = new Lane(direction,laneY,speed,maxCars);
      }
      laneY -= 20
    }
  return laneList;
}

function draw() {
  background(220);
  frog.gameOverCheck();
  createBoxes(frog.getLives(),frog.getScore(),frog.getLevel(),frog.getWins());
  if(frog.getGameOver()) {return}
  if(frog.getWins() == 5) {
    frog.levelUp();
    laneList = createLevel(frog.getLevel());
  }
  frog.display();
  frog.outOfBoundsCheck();
  frog.extraLifeCheck();
                          
  for(let i = 0; i < laneList.length; i++) {
    laneList[i].deleteCar();
    if(random() < 0.05 + frog.getLevel()*0.01) {
    laneList[i].spawnCar();
    }
    laneList[i].display();
    var carList = laneList[i].getCarList();
    for(let i = 0; i < carList.length; i++) {
      carList[i].moveCar();
      carList[i].display();
      frog.collisionCheck(carList[i]);
    }
  }
}

function keyPressed() {
  if(frog.getGameOver()) {return}
  switch(keyCode){
    case LEFT_ARROW:
      frog.playerX -= frog.getSpeed();
      break;
    case RIGHT_ARROW:
      frog.playerX += frog.getSpeed();
      break;
    case UP_ARROW:
      frog.playerY -= frog.getSpeed();
      if(frog.getY() < frog.getMaxY()) {
        frog.score += 15+frog.getLevel(); frog.newMaxY();
        if(frog.getY() == WINZONE)
          {
            frog.reset(false);
            frog.score += 200;
          }
      }
      break;
    case DOWN_ARROW:
      frog.playerY += frog.getSpeed();
      break;
  }
    
}

class Player {
  constructor() {
    //player position
    this.playerX = STARTX;
    this.playerY = STARTY;
    //player speed
    this.speed = 20;
    //player score
    this.score = 0;
    //lives remaining before game over
    this.lives = 3;
    //the furthest the player has been, lower values are further.
    this.maxY = STARTY;
    //indicates if the game is over
    this.gameOver = false;
    //indicates then points needed for an extra life
    this.extraLife = 4000;
    //indicates the level the player is on
    this.level = 0
    //indicates the number of times a level has been beaten
    this.wins = 0;
  }
  display(){
    fill('rgba(0,255,0,0.25)')
    square(this.playerX,this.playerY,20)
  }
  outOfBoundsCheck() {
    if(this.playerX >= CANVASX || this.playerX <= -20) {
      this.reset(true);
      }
    else if (this.playerY >= CANVASY) {
      this.reset(true);
      }
  }
  collisionCheck(car) {
      var carX = car.getCarX();
      var carY = car.getCarY();
      //checks to see if the player is overlaping with the car. cars are currently 40 long and 20 high
      if (this.playerX <= carX+40 && this.playerX+20 >= carX) {
        if(this.playerY == carY) {
          this.reset(true);
        }
      }
  }
  reset(died) {
    this.playerX = STARTX;
    this.playerY = STARTY;
    if(died) {this.lives -= 1;}
    else {
      this.maxY = STARTY;
      this.wins += 1;
    }
  }
  gameOverCheck() {if(this.lives == 0) {this.gameOver = true;}}
  extraLifeCheck() {if(this.score >= this.extraLife) {this.lives += 1; this.extraLife += 4000;}}
  levelUp() {
    this.wins = 0;
    this.level += 1;
  }
  newMaxY() {this.maxY = this.playerY;}
  getLives() {return this.lives;}
  getScore() {return this.score;}
  getY() {return this.playerY;}
  getMaxY() {return this.maxY;}
  getSpeed() {return this.speed;}
  getGameOver() {return this.gameOver;}
  getLevel() {return this.level;}
  getWins() {return this.wins;}
}
class Lane {
  //make constructer parametized for laneY,direction, and trafficSpeed.
  constructor(direction,Y,speed,maxCars) {
    //lane position
    this.laneX = 0;
    this.laneY = Y;
    //True is right, false is left
    this.direction = direction;
    //how fast cars move in lane
    this.trafficSpeed = speed;
    //list of every car
    this.carList = [];
    this.numberOfCars = 0;
    this.maxCars = maxCars;
  }
  display(){
    fill('rgba(0,0,0,0.25)')
    rect(this.laneX,this.laneY,400,20)
  }
  spawnCar(){
    if (this.numberOfCars < this.maxCars) {
      //check the distance of the last car and fail to spawn if they would overlap
      if(this.numberOfCars != 0) {
        if(this.carList[this.numberOfCars -1].getCarX() <= 0 && this.direction ||
           this.carList[this.numberOfCars -1].getCarX() >= CANVASX-40 && !this.direction) {
          return
        }
      }
      this.carList[this.numberOfCars] = new Car(this.laneY,this.trafficSpeed,this.direction);
      this.numberOfCars++;
    }
    
  }
  deleteCar(){
    //skip if there are no cars
    if(this.numberOfCars == 0) {return}
    //Since the first car is the oldest, only the first car needs to be checked.
    if(this.direction && this.carList[0].getCarX()-20 > CANVASX)
      {
        this.carList.shift();
        this.numberOfCars--;
      }
    else if (!this.direction && this.carList[0].getCarX()+60 < 0)
      {
        this.carList.shift();
        this.numberOfCars --;
      }
  }
  getCarList() {return this.carList}
}
class Car {
  constructor(Y,speed,direction){
    //True is right, false is left
    this.direction = direction;
    //car location
    this.carY = Y
    if(this.direction) {this.carX = -40}
    else {this.carX = CANVASX}
    this.carSpeed = speed;
  }
  display(){
    fill('rgba(253,3,3,0.25)')
    rect(this.carX,this.carY,40,20)
  }
  moveCar(){
    if(this.direction) {this.carX += this.carSpeed;} //true is right, false is left
    else{this.carX -= this.carSpeed;}
  }
  getCarX() {return this.carX}
  getCarY() {return this.carY}
}