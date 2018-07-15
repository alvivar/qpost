class MediaFile extends React.Component {
  render() {
    let extension = this.props.filename.split(".").pop();
    if (extension.toLowerCase() === "webm") {
      return this.renderWebm();
    } else {
      return this.renderImage();
    }
  }

  renderWebm() {
    return (
      <video controls muted src={this.props.filename}>
        Sorry, your browser doesn't support embedded videos.
      </video>
    );
  }

  renderImage() {
    return <img src={this.props.filename} />;
  }
}
