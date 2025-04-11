import { CommonModule, NgClass } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { setUpLocationSync } from '@angular/router/upgrade';


@Component({
  selector: 'app-root',
  imports: [NgClass,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'xo-game';
  game:string[][]=[];

  XScore:number=0;
  OScore:number=0;
  totalMatches:number=0;

  challenge:boolean=true; // true -> Human vs Ai, false -> H vs H
  theme:boolean=true; // true->dark , false->light

  player1:string="X";
  player2:string="O";
  turn:boolean=true; // true->player1, false->player2
  wturn:boolean=true;// X-> true, O -> false

  difficulty:boolean=true; //true->hard. false->easy
  
  won:number=0; // 0->Draw, 1->X, -1->O

  @ViewChild("game_board", { static: false }) game_board!: ElementRef;

  setBoard():void{
    this.game=[
      [' ',' ',' '],
      [' ',' ',' '],
      [' ',' ',' ']
    ];

    if (this.game_board) {
      const buttons = this.game_board.nativeElement.querySelectorAll('button');
      buttons.forEach((button: any) => {
        button.textContent = ' ';
        button.className = 'btn';
      });
    }
  }
  constructor(){
    this.setBoard();
  }

  startPlayer(p:string){
    this.turn=true;
    this.setBoard();
    if(p==="O"){
      this.player1="O";
      this.player2="X";
      this.wturn=false;
      if(this.challenge){
        let r=Math.floor(Math.random()*3);
        let c=Math.floor(Math.random()*3);

        const button = this.game_board.nativeElement.querySelectorAll('button')[r * 3 + c];
        button.textContent = 'O';
        button.className = 'btn text-success fs-2';
        this.game[r][c]="O";
        this.wturn=!this.wturn;
        this.turn=!this.turn;
      }
    }else{
      this.player1="X";
      this.player2="O";
      this.wturn=true;
    }
  }

  themeClick():void{
    this.theme=!this.theme;
  }

  resetScores():void{
    this.XScore=0;
    this.OScore=0;
    this.totalMatches=0;
    this.won=0;
  }

  resetGame():void{
    this.won=0;
    this.startPlayer(this.player1);

  }

  selectMode(s:string):void{
    this.challenge = s==="1vs1"?false:true;
    this.startPlayer(this.player1);
    this.won=0;
  }

  difficultyMode(s:string):void{
    this.difficulty= s==='hard'?true:false;
  }


  checkRow(game: any, player: string, row: number): boolean {
    return (game[row][0] === player) && (game[row][1] === player) && (game[row][2] === player);
  }

  checkCol(game: any, player: string, col: number): boolean {
    return (game[0][col] === player) && (game[1][col] === player) && (game[2][col] === player);
  }

  checkDiag(game: any, player: string): boolean {
    return (game[0][0] === player) && (game[1][1] === player) && (game[2][2] === player) ||
      (game[0][2] === player) && (game[1][1] === player) && (game[2][0] === player);
  }


  checkAll(game: any, player: string): boolean {
    for (let i = 0; i < 3; i++) {
      if (this.checkRow(game, player, i) || this.checkCol(game, player, i)) {
        return true;
      }
    }
    return this.checkDiag(game, player);
  }

  isEmpty(game: any): boolean {
    return game.some((row: string[]) => row.includes(' '));
  }

  btnClick(e:any,id:number){
    const element = e.target as HTMLElement;
    const row = Math.floor((id - 1) / 3);
    const col = (id - 1) % 3;
    const currentPlayer = this.wturn ? "X" : "O";


    if (this.game[row][col] === ' ') {
      this.game[row][col] = currentPlayer;
      element.textContent = currentPlayer;
      element.className = this.wturn ? 'btn text-danger fs-2' : 'btn text-success fs-2';

      if (this.checkAll(this.game,currentPlayer)) {
        setTimeout(() => {
          this.startPlayer(this.player1);
        }, 200);
        this.totalMatches += 1;
        if (currentPlayer === "X") {
          this.XScore += 1;
          this.won = 1;
        } else {
          this.OScore += 1;
          this.won = -1;
        }
        return;
      }

      if (!this.isEmpty(this.game)) {
        setTimeout(() => {
          this.startPlayer(this.player1);
        }, 100);
        this.totalMatches += 1;
        this.won = 0;
        return;
      }
      this.wturn = !this.wturn
      this.turn = !this.turn;

      // If playing against AI (O is the AI), trigger AI move
      if (this.challenge && !this.wturn) {
        setTimeout(() => {
          this.aiMove();
        }, 500);
      }
    }
  }



  aiMove() {
    const move = this.best_move(this.game);
    const row = move[0];
    const col = move[1];

    this.game[row][col] = 'O';
    const button = this.game_board.nativeElement.querySelectorAll('button')[row * 3 + col];
    button.textContent = 'O';
    button.className = 'btn text-success fs-2';

    if (this.checkAll(this.game,"O")) {
      setTimeout(() => {
        this.startPlayer(this.player1);
      }, 200);
      this.totalMatches += 1;
      this.OScore += 1;
      this.won = -1;
      return;
    }

    if (!this.isEmpty(this.game)) {
      setTimeout(() => {
        this.startPlayer(this.player1);
      }, 100);
      this.totalMatches += 1;
      this.won = 0;
      return;
    }

    this.turn = !this.turn;
    this.wturn=!this.wturn;
  }


  alpha_beta_minmax(game: any, depth: any, alpha: any, beta: any, is_max: any): any {
    if (this.checkAll(game, this.difficulty?"O":"X")) {
      return 1;
    }
    if (this.checkAll(game, this.difficulty?"X":"O")) {
      return -1;
    }
    if (!this.isEmpty(game)) {
      return 0;
    }

    if (is_max) {
      let best_score = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (game[i][j] === " ") {
            game[i][j] = "O";
            let score = this.alpha_beta_minmax(game, depth + 1, alpha, beta, false);
            game[i][j] = " ";
            best_score = Math.max(score, best_score);
            alpha = Math.max(alpha, best_score);
            if (beta <= alpha) {
              break;
            }
          }
        }
      }
      return best_score;
    } else {
      let best_score = Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (game[i][j] === " ") {
            game[i][j] = "X";
            let score = this.alpha_beta_minmax(game, depth + 1, alpha, beta, true);
            game[i][j] = " ";
            best_score = Math.min(score, best_score);
            beta = Math.min(beta, best_score);
            if (beta <= alpha) {
              break;
            }
          }
        }
      }
      return best_score;
    }
  }

  best_move(game: any) {
    let best_score = -Infinity;
    let move = [-1, -1];
    let alpha = -Infinity;
    let beta = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (game[i][j] === " ") {
          game[i][j] = "O";
          let score = this.alpha_beta_minmax(game, 0, alpha, beta, false);
          game[i][j] = " ";
          if (score > best_score) {
            best_score = score;
            move = [i, j];
          }
        }
      }
    }
    return move;
  }
}
