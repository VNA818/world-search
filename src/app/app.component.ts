import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { GameService } from './game.service';
import { MapComponent } from './map/map.component';
import { StreetViewComponent } from './street-view/street-view.component';
import { ActionBarComponent } from './action-bar/action-bar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'World-Search';

  @ViewChild(MapComponent, { static: false }) map!: MapComponent;
  @ViewChild(StreetViewComponent, { static: false }) pano!: StreetViewComponent;
  @ViewChild(ActionBarComponent, { static: false }) ab!: ActionBarComponent;

  currentLocation: Array<number> = [];
  selectedLocation: Array<number> = [];
  locationNumber: number = -1;
  historyData: Array<any> = [];
  distance: number = -1;
  streak: number = 0;

  constructor (private game: GameService) {}

  newLocation() {
    if(this.streak > 0 && this.distance == -1) {
      if (confirm("Are you sure? You will lose your streak.")) {
        this.streak = 0;
        this.runGame();
      }
    } else {
      this.runGame();
    }
  }

  rth() {
    this.pano.loadPano(this.currentLocation);
  }

  mapSelect(event: Array<number>) {
    this.selectedLocation = event;
  }

  share() {
    this.game.shareEncode(this.locationNumber, this.distance);
  }

  shareLoad(id: string) {
    this.runGame(this.game.shareDecode(id), [], [], -1);
  }

  async addStreak(actual: Array<number>, guess: Array<number>) {
    const result = await this.game.streak(actual, guess)
    if(await result == true) {
      this.streak += 1;
    } else if(await result == false){
      this.streak = 0;
    }
  }

  historyLoad(num: number) {
    let current = this.historyData[num];
    this.runGame(current.number, current.guess, current.target, current.distance);
    //slightly altered view
    this.map.displayMap(this.selectedLocation, this.currentLocation);
    this.distance = current.distance;
    this.game.alertBox("Loaded history " + current.time[0] + ' : ' + ("0" + current.time[1]).slice(-2), "Dismiss");
    this.selectedLocation = [];
    this.ab.showShare();
  }

  updateHistory() {
    this.addStreak(this.currentLocation, this.selectedLocation);
    var now = new Date();
    this.historyData = [...this.historyData, {
      target: this.currentLocation,
      guess: this.selectedLocation,
      distance: this.distance,
      number: this.locationNumber,
      time: [Math.abs(now.getHours() - 12), now.getMinutes()]
    }];
    this.selectedLocation = [];
  }

  searchHistory(location: Array<number>): boolean {
    for(let i = 0; i < this.historyData.length; i++) {
      let x = this.historyData[i];
      if(x.target[0] == location[0] && x.target[1] == location[1]) {
        return false;
      }
    }
    return true;
  }

  view() {
    this.distance = this.game.distance(this.currentLocation, this.selectedLocation);
    console.log(this.distance + ' miles away');
    this.map.resultMap(this.selectedLocation, this.currentLocation);
  }

  guess() {
    this.view();
    this.game.alertBox('Your Guess was: ' + this.distance.toFixed(2) + ' miles away!', 'Dismiss');
    this.updateHistory();
  }

  runGame(num: number = -1, sL: Array<number> = [], cL: Array<number> = [], d: number = -1) {
    this.locationNumber = num;
    this.selectedLocation = sL;
    this.currentLocation = cL;
    this.distance = d;
    if(num == -1 && cL.length == 0) { //normal game
      this.map.initMap();
      let current = this.game.randomLocation();
      if(this.searchHistory([current[0], current[1]])) {
        this.currentLocation[0] = current[0];
        this.currentLocation[1] = current[1];
        this.locationNumber = current[2];
      } else {
        this.runGame();
      }   
    } else if(num >= 0 && sL.length == 0) { //load
      this.map.initMap();
      this.currentLocation = this.game.getLocation(num);
    }
    this.pano.loadPano(this.currentLocation);
  }

  hn() {
    window.open("https://maps.google.com", '_blank');
  }

  gm_authFailure(value: string) {
    alert("Google Maps API error: " + value);
  }

  ngAfterViewInit(): void {
    this.streak = 0;
    let param = this.game.getParams('share');
    if(param != null) {
      this.shareLoad(param);
    } else {
      this.runGame();
    }
  }

  ngOnInit() {

  }
}
