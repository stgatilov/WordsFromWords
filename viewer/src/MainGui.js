import React from 'react';

const GOOD_FREQ = 1e-4;

class LetterGui extends React.Component {
  constructor() {
    super();
  }
  render() {
    return (
      <button id={this.props.id} className="letter" disabled={this.props.greyed ? "disabled" : undefined} onMouseDown={this.props.onClick}>
        {this.props.letter}
      </button>
    );
  }
}

class WordGui extends React.Component {
  constructor() {
    super();
  }
  render() {
    var letters = this.props.text.split('');
    var openedIds = this.props.openedIds || [];
    var extOnClick = this.props.onClick;
    var greyedIds = this.props.greyedIds || [];
    return (
      <table>
        <tbody>
          <tr>
            {letters.map((ch,i) => (
              <td key={i}>
                <LetterGui letter={!openedIds[i] ? '_' : ch} greyed={greyedIds[i]} onClick={() => {
                  extOnClick(i,ch);
                }}/>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  }
}

class WordsTableGui extends React.Component {
  constructor() {
    super();
  }
  render() {
    var wordList = this.props.words;
    wordList.sort((a,b) => {
      if (a.length !== b.length)
        return a.length > b.length ? -1 : 1;
      if (a !== b)
        return a < b ? -1 : 1;
      return 0;
    });

    var COLN = 6;
    var ROWN = Math.ceil(wordList.length / COLN);

    var wordTable = [];
    for (var i = 0; i < ROWN; i++) {
      wordTable[i] = Array(COLN);
      for (var j = 0; j < COLN; j++) {
        wordTable[i][j] = "";
        var k = j * ROWN + i;
        if (k < wordList.length)
          wordTable[i][j] = wordList[k];
      }
    }

    var extOnClick = this.props.onClick;
    return (
      <table className="wordtable">
        <tbody>
          {wordTable.map((row,i) => (
            <tr key={i}>
              {row.map((cell,j) => (
                <td key={j}>
                  <WordGui text={cell} openedIds={this.props.opened[cell]} onClick={(i,ch) => {
                    extOnClick(cell, i, ch);
                  }}/>
                  {'*'.repeat(this.props.stars[cell])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

class MainGui extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mainWord : MainGui.chooseRandomWord(props),
      inputWord : "",
      inputUsed: [],
      opened : {},
      lastVerdict : "",
      extraRareGuessed: {},
    };
  }

  static chooseRandomWord(props) {
    var allWords = Object.keys(props.data);
    var idx = Math.floor(Math.random() * allWords.length);
    return allWords[idx];
  }

  updateState(dict) {
    this.setState(Object.assign({}, this.state, dict));
  }

  addLetter(idx) {
    if (this.state.inputUsed[idx])
      return;
    var newWord = this.state.inputWord + this.state.mainWord[idx];
    var newUsed = this.state.inputUsed.slice();
    newUsed[idx] = true;
    this.updateState({inputWord: newWord, inputUsed: newUsed});
  }

  checkWord(stringSet) {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    if (stringSet === undefined)
      stringSet = [this.state.inputWord];

    var newOpened = Object.assign({}, this.state.opened);
    var newRare = Object.assign({}, this.state.extraRareGuessed);
    var lastVerdict = "такого слова нет...";
    for (var str of stringSet) {
      for (var x of problem) {
        if (x[0] === str) {
          var openedCnt = 0;
          if (str in newOpened)
            for (var i = 0; i < str.length; i++)
              openedCnt += !!newOpened[str][i];
          lastVerdict = (openedCnt === str.length ? "уже отгадано." : "ВЕРНО!")
          newOpened[str] = [];
          for (var i = 0; i < str.length; i++)
            newOpened[str][i] = true;
          if (x[2] < GOOD_FREQ)
            newRare[str] = true;
        }
      }
    }

    this.updateState({opened: newOpened, inputWord: "", lastVerdict: lastVerdict, inputUsed: [], extraRareGuessed: newRare});
  }

  openLetter(word, idx) {
    var newOpened = Object.assign({}, this.state.opened);
    if (!(word in newOpened))
      newOpened[word] = [];
    newOpened[word][idx] = true;
    this.updateState({opened: newOpened});
  }

  openAll() {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    this.checkWord(problem.map(x => x[0]));
  }

  render() {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    var mainOpened = Array(mainWord.length).fill(true);

    var stars = {};
    var problemMain = [], problemRare = [];
    for (var x of problem) {
      var prob = x[2], str = x[0];
      var num = Math.floor(-Math.log10(prob) * 2) - 3;
      if (num < 1) num = 1;
      if (num > 7) num = 7;
      stars[str] = num;
      if (prob >= GOOD_FREQ)
        problemMain.push(x);
      if (str in this.state.extraRareGuessed)
        problemRare.push(x);
    }

    return (
      <div>
        <WordsTableGui words={problemMain.map(x => x[0])} stars={stars} opened={this.state.opened} onClick={(cell,i,ch) => {
          this.openLetter(cell, i);
        }}/>
        <WordGui text={mainWord} openedIds={mainOpened} greyedIds={this.state.inputUsed} onClick={(i,ch) => {
          this.addLetter(i);
        }}/>
        <div>&nbsp;{this.state.inputWord}</div>
        <button onClick={() => this.checkWord()}>
          Проверить
        </button>
        <button onClick={() => this.openAll()}>
          Открыть все
        </button>
        <div>&nbsp;{this.state.lastVerdict}</div>
        <WordsTableGui words={problemRare.map(x => x[0])} stars={stars} opened={this.state.opened}/>
      </div>
    );
  }
}
export default MainGui;
