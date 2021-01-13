import React from 'react';

class LetterGui extends React.Component {
  constructor() {
    super();
  }
  render() {
    return (
      <button id={this.props.id} disabled={this.props.greyed ? "disabled" : undefined} onClick={this.props.onClick}>
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
                <LetterGui letter={!openedIds[i] ? '?' : ch} greyed={greyedIds[i]} onClick={() => {
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
      <table>
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

  checkWord() {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    var str = this.state.inputWord;

    var newOpened = Object.assign({}, this.state.opened);
    var lastVerdict = "такого слова нет...";
    for (var x of problem)
      if (x[0] === str) {
        var openedCnt = 0;
        if (str in newOpened)
          for (var i = 0; i < str.length; i++)
            openedCnt += !!newOpened[str][i];
        lastVerdict = (openedCnt === str.length ? "уже отгадано." : "ВЕРНО!")
        newOpened[str] = [];
        for (var i = 0; i < str.length; i++)
          newOpened[str][i] = true;
      }

    this.updateState({opened: newOpened, inputWord: "", lastVerdict: lastVerdict, inputUsed: []});
  }

  openLetter(word, idx) {
    var newOpened = Object.assign({}, this.state.opened);
    if (!(word in newOpened))
      newOpened[word] = [];
    newOpened[word][idx] = true;
    this.updateState({opened: newOpened});
  }

  render() {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    var mainOpened = Array(mainWord.length).fill(true);
    var subwords = problem.map(x => x[0]);
    var stars = {};
    for (var x of problem) {
      var prob = x[2], str = x[0];
      var num = Math.floor(-Math.log10(prob) * 2) - 3;
      if (num < 1) num = 1;
      if (num > 7) num = 7;
      stars[str] = num;
    }
    return (
      <div>
        <WordsTableGui words={subwords} stars={stars} opened={this.state.opened} onClick={(cell,i,ch) => {
          this.openLetter(cell, i);
        }}/>
        <WordGui text={mainWord} openedIds={mainOpened} greyedIds={this.state.inputUsed} onClick={(i,ch) => {
          this.addLetter(i);
        }}/>
        <div>&nbsp;{this.state.inputWord}</div>
        <button onClick={() => this.checkWord()}>
          Проверить
        </button>
        <div>&nbsp;{this.state.lastVerdict}</div>
      </div>
    );
  }
}
export default MainGui;
