class ImageDescription extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      editMode: false,
      value: props.value,
    }

    this.toggleEditMode = this.toggleEditMode.bind(this)
    this.updateValueOnChange = this.updateValueOnChange.bind(this)
    this.saveData = this.saveData.bind(this)
    this.saveOnKeyDown = this.saveOnKeyDown.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.value !== nextProps.value) {
      this.setState({ value: nextProps.value })
    }
  }

  toggleEditMode() {
    this.setState({
      editMode: !this.state.editMode,
    })
  }

  updateValueOnChange(e) {
    this.setState({
      value: e.target.value,
    })
  }

  saveData() {
    let id = this.props.id
    let value = this.state.value
    let newData = [...this.props.data].map((i) => {
      if (i.id === id) i.text = value
      return i
    })

    this.props.updateData(newData)
    this.toggleEditMode()
  }

  saveOnKeyDown(e) {
    // Ctrl + Enter
    if ((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey) {
      this.saveData()
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
    )
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
    )
  }

  render() {
    if (!this.state.editMode) {
      this.props.setIgnoreShortcuts(false)
      return this.renderShow()
    } else {
      this.props.setIgnoreShortcuts(true)
      return this.renderEdit()
    }
  }
}
