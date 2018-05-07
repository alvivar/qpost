class PathInput extends React.Component {
  constructor(props) {
    super(props);

    this.scanOnKeyDown = this.scanOnKeyDown.bind(this);
    this.changePathOnClick = this.changePathOnClick.bind(this);
  }

  scanOnKeyDown(e) {
    // Enter
    if (e.keyCode === 10 || e.keyCode === 13) {
      this.props.scanPath(e);
    }
  }

  changePathOnClick(e, path) {
    e.target.value = path;
    this.props.updatePath(e);
    this.pathInput.focus();
  }

  render() {
    let recentPaths = this.props.recentPaths.map(i => {
      return (
        <p>
          <a onClick={e => this.changePathOnClick(e, i)}>{i}</a>
        </p>
      );
    });

    let buttonClass = "button";
    let buttonText = "";

    if (this.props.error) {
      buttonClass = "button is-danger";
      buttonText = this.props.error;
    } else if (this.props.waiting) {
      buttonClass = "button is-warning is-loading";
    }

    return (
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container">
            <nav className="level">
              <div className="level-item">
                <input
                  ref={input => (this.pathInput = input)}
                  autoFocus
                  className="input"
                  type="text"
                  placeholder="Paste your path here and click 'Scan'"
                  value={this.props.path}
                  onChange={this.props.updatePath}
                  onKeyDown={this.scanOnKeyDown}
                />
                <a className={buttonClass} onClick={this.props.scanPath}>
                  <span className="icon">
                    <img src="/app/img/search.svg" alt="Scan" />
                  </span>
                  {buttonText ? <span>{buttonText}</span> : null}
                </a>
              </div>
            </nav>
            {recentPaths}
          </div>
        </div>
      </section>
    );
  }
}

class Post extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      value: props.value
    };

    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.updateValueOnChange = this.updateValueOnChange.bind(this);
    this.saveData = this.saveData.bind(this);
    this.saveOnKeyDown = this.saveOnKeyDown.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.value !== nextProps.value) {
      this.setState({ value: nextProps.value });
    }
  }

  toggleEditMode() {
    this.setState({
      editMode: !this.state.editMode
    });
  }

  updateValueOnChange(e) {
    this.setState({
      value: e.target.value
    });
  }

  saveData() {
    let id = this.props.id;
    let value = this.state.value;
    let newData = [...this.props.data].map(i => {
      if (i.id === id) i.text = value;
      return i;
    });

    this.props.updateData(newData);
    this.toggleEditMode();
  }

  saveOnKeyDown(e) {
    // Ctrl + Enter
    if ((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey) {
      this.saveData();
    }
  }

  renderShow() {
    return (
      <div>
        <span onClick={this.toggleEditMode}>
          {this.state.value.trim() ? (
            this.state.value
          ) : (
            <p className="help">(Click to edit description)</p>
          )}
        </span>
      </div>
    );
  }

  renderEdit() {
    return (
      <div>
        <textarea
          autoFocus
          className="textarea"
          value={this.state.value}
          onChange={this.updateValueOnChange}
          onKeyDown={this.saveOnKeyDown}
        />
        <br />
        <a className="button is-primary" onClick={this.saveData}>
          Save
        </a>
      </div>
    );
  }

  render() {
    if (!this.state.editMode) {
      this.props.setIgnoreShortcuts(false);
      return this.renderShow();
    } else {
      this.props.setIgnoreShortcuts(true);
      return this.renderEdit();
    }
  }
}

class PostsCollection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showLove: false,
      showIgnore: false
    };

    this.cardsRef = [];
    this.lastRandomCards = [];
    this.ignoreShortcuts = false;

    this.moveUp = this.moveUp.bind(this);
    this.moveDown = this.moveDown.bind(this);
    this.toggleLove = this.toggleLove.bind(this);
    this.toggleIgnore = this.toggleIgnore.bind(this);
    this.toggleShowLove = this.toggleShowLove.bind(this);
    this.toggleShowIgnore = this.toggleShowIgnore.bind(this);
    this.showNormal = this.showNormal.bind(this);
    this.deleteIgnoreFiles = this.deleteIgnoreFiles.bind(this);
    this.setIgnoreShortcuts = this.setIgnoreShortcuts.bind(this);
    this.handleKeyboard = this.handleKeyboard.bind(this);
  }

  componentWillUpdate() {
    this.cardsRef = []; // New cards refs every render
    this.lastRandomCards = [];
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyboard);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyboard);
  }

  setIgnoreShortcuts(value) {
    if (this.ignoreShortcuts != value) this.ignoreShortcuts = value;
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  autoWidthToView(el, step = 8, padding = 32) {
    if (!this.isInsideView(el)) return;

    step = step <= 0 ? 1 : step;
    let width = el.offsetWidth;

    while (!this.isInsideView(el, false)) {
      width -= step;
      el.style.width = width + "px";
    }

    while (this.isInsideView(el, false)) {
      width += step;
      el.style.width = width + "px";
    }

    width -= padding;
    el.style.width = width + "px";
  }

  handleKeyboard(e) {
    if (this.ignoreShortcuts) return;

    let cards = this.cardsRef.filter(i => i !== null);
    let count = cards.length;
    if (count < 1) return;

    // Sort by closest to the scroll
    let scrollTop = document.documentElement.scrollTop;
    let cardsVisible = this.filterVisible(cards);
    cardsVisible.sort(
      (a, b) =>
        Math.abs(scrollTop - a.offsetTop) - Math.abs(scrollTop - b.offsetTop)
    );

    let currentCard = cardsVisible[0];
    let currentIndex = cards.indexOf(currentCard);

    // Current cards will be ignored when jumpting to a random image
    if (this.lastRandomCards.indexOf(currentIndex) === -1)
      this.lastRandomCards.push(currentIndex);

    while (this.lastRandomCards.length > count / 5 * 4)
      this.lastRandomCards.splice(0, 1);

    if (e.keyCode === 78) {
      // 'n' goes to a random image card

      let random = this.randomInt(0, count - 1);
      while (this.lastRandomCards.indexOf(random) !== -1)
        random = this.randomInt(0, count - 1);
      this.lastRandomCards.push(random);

      while (this.lastRandomCards.length > count / 5 * 4)
        this.lastRandomCards.splice(0, 1);

      window.scrollTo(0, cards[random].offsetTop);

      this.autoWidthToView(cards[random]);
    } else if (e.keyCode === 74) {
      // 'j' goes to the next image
      let nextCard = cards[currentIndex + 1];

      if (nextCard !== void 0) window.scrollTo(0, nextCard.offsetTop);
      else window.scrollTo(0, currentCard.offsetTop);

      this.autoWidthToView(nextCard);
    } else if (e.keyCode === 75) {
      // 'k' goes to the previous image
      let nextCard = cards[currentIndex - 1];

      if (nextCard !== void 0) window.scrollTo(0, nextCard.offsetTop);
      else window.scrollTo(0, currentCard.offsetTop);

      this.autoWidthToView(nextCard);
    } else if (e.keyCode === 76) {
      // 'l' love toggle the image
      this.toggleLove(currentCard.id, null, currentCard.offsetTop);
    } else if (e.keyCode === 73) {
      // 'i' ignore toggle the image
      this.toggleIgnore(currentCard.id, null, currentCard.offsetTop);
    }
  }

  isInsideView(el, partially = true) {
    let rect = el.getBoundingClientRect();
    let elemTop = rect.top;
    let elemBottom = rect.bottom;
    let elemRight = rect.right;

    // Only completely visible elements return true:
    let isVisible =
      elemTop >= 0 &&
      elemBottom <= window.innerHeight &&
      elemRight <= window.innerWidth;

    // Partially visible elements return true:
    if (partially) isVisible = elemTop < window.innerHeight && elemBottom >= 0;

    return isVisible;
  }

  filterVisible(elements) {
    return elements.reduce((list, i) => {
      if (i === null) return list;

      let index = list.indexOf(i);
      if (!this.isInsideView(i)) {
        if (index !== -1) {
          list.splice(index, 1);
        }
      } else {
        if (index === -1) {
          list.unshift(i);
        }
      }

      return list;
    }, []);
  }

  getBrothersIds(id, data) {
    let idIndex = data.findIndex(i => i.id === id);
    let upId = data[idIndex - 1] !== void 0 ? data[idIndex - 1].id : false;
    let downId = data[idIndex + 1] !== void 0 ? data[idIndex + 1].id : false;

    return {
      up: upId,
      down: downId
    };
  }

  moveUp(id, e) {
    // Scroll to the start of the current element
    window.scrollTo(0, e.target.parentElement.parentElement.offsetTop);

    // Find
    let allData = [...this.props.data];
    let idIndex = allData.findIndex(i => i.id === id);

    // Images on the current list
    let ids = [];
    if (this.state.showLove) {
      ids = this.getBrothersIds(id, allData.filter(i => i.love));
    } else if (this.state.showIgnore) {
      ids = this.getBrothersIds(id, allData.filter(i => i.ignore));
    } else {
      ids = this.getBrothersIds(id, allData.filter(i => !i.ignore));
    }

    if (ids.up) {
      // Extract
      let value = allData[idIndex];
      allData.splice(idIndex, 1); // Remove

      // Insert
      let upIndex = allData.findIndex(i => i.id === ids.up);
      allData.splice(upIndex, 0, value);
    }

    return this.props.updateData(allData);
  }

  moveDown(id, e) {
    // Scroll to the start of the current element
    window.scrollTo(0, e.target.parentElement.parentElement.offsetTop);

    // Find
    let allData = [...this.props.data];
    let idIndex = allData.findIndex(i => i.id === id);

    // Images on the current list
    let ids = [];
    if (this.state.showLove) {
      ids = this.getBrothersIds(id, allData.filter(i => i.love));
    } else if (this.state.showIgnore) {
      ids = this.getBrothersIds(id, allData.filter(i => i.ignore));
    } else {
      ids = this.getBrothersIds(id, allData.filter(i => !i.ignore));
    }

    if (ids.down) {
      // Extract
      let value = allData[idIndex];
      allData.splice(idIndex, 1); // Remove

      // Insert
      let upIndex = allData.findIndex(i => i.id === ids.down);
      allData.splice(upIndex + 1, 0, value);
    }

    return this.props.updateData(allData);
  }

  toggleLove(id, e, offsetTop = false) {
    let scrollOffset = offsetTop
      ? offsetTop
      : e.target.parentElement.parentElement.offsetTop;

    // Toggle love
    let allData = [...this.props.data];
    let newData = allData.map(i => {
      if (i.id === id) {
        i.love = !i.love;
        if (this.state.showLove && !i.love)
          // Scroll to the start of the element on unlove
          window.scrollTo(0, scrollOffset);
      }
      return i;
    });

    this.props.updateData(newData);
  }

  toggleIgnore(id, e, offsetTop = false) {
    // Scroll to the start of the current element
    let scrollOffset = offsetTop
      ? offsetTop
      : e.target.parentElement.parentElement.offsetTop;
    window.scrollTo(0, scrollOffset);

    // Toggle ignore
    let allData = [...this.props.data];
    let newData = allData.map(i => {
      if (i.id === id) i.ignore = !i.ignore;
      return i;
    });

    this.props.updateData(newData);
  }

  toggleShowLove() {
    if (this.state.showLove) {
      window.scrollTo(0, 0);
      return;
    }

    this.buttonLove.classList.toggle("is-loading");
    setTimeout(
      function() {
        window.scrollTo(0, 0);
        this.setState({
          showLove: true,
          showIgnore: false
        });
      }.bind(this),
      10
    );
  }

  toggleShowIgnore() {
    if (this.state.showIgnore) {
      window.scrollTo(0, 0);
      return;
    }

    this.buttonIgnore.classList.toggle("is-loading");
    setTimeout(
      function() {
        window.scrollTo(0, 0);
        this.setState({
          showIgnore: true,
          showLove: false
        });
      }.bind(this),
      10
    );
  }

  showNormal() {
    if (!this.state.showLove && !this.state.showIgnore) {
      window.scrollTo(0, 0);
      return;
    }

    this.buttonNormal.classList.toggle("is-loading");
    setTimeout(
      function() {
        window.scrollTo(0, 0);
        this.setState({
          showLove: false,
          showIgnore: false
        });
      }.bind(this),
      10
    );
  }

  deleteIgnoreFiles() {
    this.buttonIgnore.classList.toggle("is-loading");
    this.buttonDelete.classList.toggle("is-loading");

    setTimeout(
      function() {
        this.props.deleteIgnoreFiles();
        this.showNormal();
      }.bind(this),
      10
    );
  }

  render() {
    // Data filtering
    let chosenData = [];
    if (this.state.showLove) {
      chosenData = this.props.data.filter(i => i.love);
    } else if (this.state.showIgnore) {
      chosenData = this.props.data.filter(i => i.ignore);
    } else {
      chosenData = this.props.data.filter(i => !i.ignore);
    }

    // Entry generation
    let posts = chosenData.map(data => {
      let buttonLoveClass = "button card-footer-item";
      if (data.love) buttonLoveClass = "button is-info card-footer-item";

      return (
        <div>
          <hr />
          <div
            className="columns is-mobile is-gapless"
            ref={card => this.cardsRef.push(card)}
            id={data.id}
          >
            <div className="column">
              <figure className="image">
                <img src={data.appFile} />
              </figure>
            </div>
            <div className="column" style={{ maxWidth: "48px" }}>
              <a
                onClick={e => this.toggleLove(data.id, e)}
                className={buttonLoveClass}
              >
                <img
                  src="/app/img/heart.svg"
                  alt="Love"
                  style={{
                    maxWidth: "20px",
                    maxHeight: "20px"
                  }}
                />
              </a>
              <a
                onClick={e => this.moveUp(data.id, e)}
                className="button card-footer-item"
              >
                <img
                  src="/app/img/caret-up.svg"
                  alt="Up"
                  style={{
                    maxWidth: "25px",
                    maxHeight: "25px"
                  }}
                />
              </a>
              <a
                onClick={e => this.moveDown(data.id, e)}
                className="button card-footer-item"
              >
                <img
                  src="/app/img/caret-down.svg"
                  alt="Down"
                  style={{
                    maxWidth: "25px",
                    maxHeight: "25px"
                  }}
                />
              </a>
              <a
                onClick={e => this.toggleIgnore(data.id, e)}
                className="button card-footer-item"
              >
                <img
                  src="/app/img/ban.svg"
                  alt="Ignore"
                  style={{
                    maxWidth: "20px",
                    maxHeight: "20px"
                  }}
                />
              </a>
            </div>
          </div>
          <div className="column">
            <Post
              id={data.id}
              value={data.text}
              data={this.props.data}
              updateData={this.props.updateData}
              setIgnoreShortcuts={this.setIgnoreShortcuts}
            />
          </div>
          <hr />
        </div>
      );
    });

    let buttonNormalText = `${this.props.dataCount}`;
    let buttonNormalClass = "button";
    if (!this.state.showLove && !this.state.showIgnore)
      buttonNormalClass = "button is-warning";

    let buttonLoveText = `${this.props.loveCount}`;
    let buttonLoveClass = "button";
    if (this.state.showLove) buttonLoveClass = "button is-warning";

    let buttonIgnoreText = `${this.props.ignoreCount}`;
    let buttonIgnoreClass = "button";
    if (this.state.showIgnore) buttonIgnoreClass = "button is-warning";

    return (
      <section className="section">
        <nav className="level navbar is-fixed-top">
          <div className="level-item">
            <a className="button" onClick={this.props.clearPath}>
              <span className="icon">
                <img src="/app/img/home.svg" alt="Home" />
              </span>
            </a>
            <a
              ref={i => (this.buttonNormal = i)}
              className={buttonNormalClass}
              onClick={this.showNormal}
            >
              <span className="icon">
                <img src="/app/img/images.svg" alt="Images" />
              </span>
              <span>{buttonNormalText}</span>
            </a>
            <a
              ref={i => (this.buttonLove = i)}
              className={buttonLoveClass}
              onClick={this.toggleShowLove}
            >
              <span className="icon">
                <img src="/app/img/heart.svg" alt="Love" />
              </span>
              <span>{buttonLoveText}</span>
            </a>
            <a
              ref={i => (this.buttonIgnore = i)}
              className={buttonIgnoreClass}
              onClick={this.toggleShowIgnore}
            >
              <span className="icon">
                <img src="/app/img/ban.svg" alt="Ignore" />
              </span>
              <span>{buttonIgnoreText}</span>
            </a>
            {this.state.showIgnore ? (
              <a
                ref={i => (this.buttonDelete = i)}
                className="button is-danger"
                onClick={this.deleteIgnoreFiles}
              >
                <span className="icon">
                  <img src="/app/img/trash-alt.svg" alt="Delete" />
                </span>
              </a>
            ) : null}
          </div>
        </nav>
        <div className="container">
          <div>{posts}</div>
        </div>
      </section>
    );
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasPath: false,
      hasError: false,
      isWaiting: false,
      recentPaths: [],
      path: "",
      data: [],
      dataCount: 0,
      loveCount: 0,
      ignoreCount: 0
    };

    this.updatePathOnChange = this.updatePathOnChange.bind(this);
    this.scanPathOnClick = this.scanPathOnClick.bind(this);
    this.clearPathOnClick = this.clearPathOnClick.bind(this);
    this.updateData = this.updateData.bind(this);
    this.deleteIgnoreFiles = this.deleteIgnoreFiles.bind(this);
  }

  async componentWillMount() {
    if (this.state.recentPaths.length > 0) return;

    let config = await eel.loadconfigfile()();
    this.setState({
      recentPaths: config["recentPaths"]
    });
  }

  updatePathOnChange(e) {
    this.setState({
      path: e.target.value
    });
  }

  async getPathData(path) {
    // Read the saved file for previously scanned paths
    let savedData = await eel.loadpathfile(path)();

    // Scan the path for new data
    let allow = ["*.gif", "*.jpg", "*.png"]; // Only images
    let files = await eel.get_files_dirs(path, allow)();
    files = files[0]; // First element from the tuple result are the files, seconds dirs

    if (files.length > 0) {
      // We need to copy the files in the app folder to render
      // them because of chrome safety rules :/
      let localPath = await eel.copytree(path, allow)();
      let localFiles = await eel.get_files_dirs(localPath, allow)();
      localFiles = localFiles[0];

      // Create a data node for each file
      let scannedData = localFiles.map(async (i, index) => ({
        id: await eel.flatname(i, true)(),
        file: files[index],
        appFile: i.split("\\eelapp").pop(), // Path relative to Eel app
        text: "",
        love: false,
        ignore: false
      }));

      await Promise.all(scannedData).then(
        promisedData => (scannedData = promisedData)
      );

      // Extract the unique files from the saved + the scanned
      let filesKnown = [];
      let mergeData = savedData.concat(scannedData).reduce((list, i) => {
        if (filesKnown.indexOf(i.file) === -1) {
          filesKnown.push(i.file);
          list.push(i);
        }
        return list;
      }, []);

      return mergeData;
    }
  }

  async scanPathOnClick(e) {
    this.setState({ isWaiting: true });

    let pathData = await this.getPathData(this.state.path);
    if (pathData && pathData.length > 0) {
      // Recent paths to the top
      let recentPaths = this.state.recentPaths;
      let pathRecentIndex = recentPaths.indexOf(this.state.path);

      if (pathRecentIndex === -1) {
        recentPaths = [this.state.path, ...recentPaths];
      } else {
        recentPaths.splice(pathRecentIndex, 1); // Remove
        recentPaths = [this.state.path, ...recentPaths];
      }

      this.setState({
        recentPaths: recentPaths
      });

      // Save them
      await eel.saveconfigfile({
        recentPaths: recentPaths
      })();

      // Divide them
      let normalData = pathData.filter(i => !i.ignore);
      let ignoreData = pathData.filter(i => i.ignore);
      let loveData = pathData.filter(i => i.love);

      this.setState({
        hasPath: true,
        hasError: false,
        isWaiting: false,
        data: pathData,
        dataCount: normalData.length,
        loveCount: loveData.length,
        ignoreCount: ignoreData.length
      });

      await eel.savepathfile(this.state.path, pathData)();
    } else {
      this.setState({
        hasError: "No files found!",
        isWaiting: false
      });

      setTimeout(
        function() {
          this.setState({ hasError: false });
        }.bind(this),
        1500
      );
    }
  }

  clearPathOnClick(e) {
    this.setState({
      hasPath: false
    });
  }

  async updateData(newData) {
    // Divide
    let normalData = newData.filter(i => !i.ignore);
    let ignoreData = newData.filter(i => i.ignore);
    let loveData = newData.filter(i => i.love);

    this.setState({
      data: newData,
      dataCount: normalData.length,
      loveCount: loveData.length,
      ignoreCount: ignoreData.length
    });

    // Files
    await eel.savepathfile(this.state.path, newData)();
    await eel.saveqbotfile(this.state.path)();
  }

  async deleteIgnoreFiles() {
    let toDelete = this.state.data.filter(i => i.ignore).map(i => i.file);
    await eel.deleteFiles(toDelete)();

    let newData = this.state.data.filter(i => !i.ignore);
    this.updateData(newData);
  }

  renderPathInput() {
    return (
      <PathInput
        recentPaths={this.state.recentPaths}
        path={this.state.path}
        updatePath={this.updatePathOnChange}
        scanPath={this.scanPathOnClick}
        error={this.state.hasError}
        waiting={this.state.isWaiting}
      />
    );
  }

  renderPosts() {
    return (
      <PostsCollection
        data={this.state.data}
        dataCount={this.state.dataCount}
        loveCount={this.state.loveCount}
        ignoreCount={this.state.ignoreCount}
        updateData={this.updateData}
        deleteIgnoreFiles={this.deleteIgnoreFiles}
        clearPath={this.clearPathOnClick}
      />
    );
  }

  render() {
    if (this.state.hasPath) {
      return this.renderPosts();
    } else {
      return this.renderPathInput();
    }
  }
}

ReactDOM.render(<Main />, document.getElementById("root"));
