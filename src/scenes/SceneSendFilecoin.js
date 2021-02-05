import * as React from "react";
import * as SVG from "~/src/components/SVG.js";
import * as Utilities from "~/src/common/utilities";

import Input from "~/src/components/Input";
import SelectMenu from "~/src/components/SelectMenu";
import Button from "~/src/components/Button";

import "~/src/scenes/Scene.css";

export default class SceneSendFilecoin extends React.Component {
  state = {
    fil: 0.1,
    source: null,
    destination: "f2puts6g7ady7oojw6ibjz4pfp37anyhk3tb56nfi",
    loading: false,
  };

  _handleChange = (e) => this.setState({ [e.target.name]: e.target.value });

  _handleSendFilecoin = async (e) => {
    this.setState({ loading: true });

    if (Utilities.isEmpty(this.state.source)) {
      alert("You must specify a source address.");
      return this.setState({ loading: false });
    }

    if (Utilities.isEmpty(this.state.destination)) {
      alert("You must specify a destination.");
      return this.setState({ loading: false });
    }

    if (this.state.fil <= 0) {
      alert("You must provide a real amount of Filecoin to transfer.");
      return this.setState({ loading: false });
    }

    const response = await this.props.onSendFilecoin({
      fil: this.state.fil,
      source: this.state.source,
      destination: this.state.destination,
    });

    console.log(response);

    // TODO(jim): On error, bail!
  };

  render() {
    console.log(this.state);

    return (
      <div className="scene">
        <div className="body">
          <h1 className="body-heading">Send Filecoin</h1>
          <p className="body-paragraph">Send your Filecoin to the address of your choice.</p>

          <h2 className="body-heading-two" style={{ marginTop: 48 }}>
            Source wallet address
          </h2>
          <p className="body-paragraph" style={{ marginBottom: 12 }}>
            The source of your Filecoin funds.
          </p>

          <SelectMenu
            name="source"
            value={this.state.source}
            onChange={this._handleChange}
            options={this.props.accounts.addresses.map((each) => {
              return {
                value: each.address,
                name: Utilities.isEmpty(each.alias) ? each.address : each.alias,
              };
            })}
          />

          <Input
            title="Destination wallet address"
            description="The destination address where you would like to receive your Filecoin."
            name="destination"
            style={{ marginTop: 48 }}
            value={this.state.destination}
            onChange={this._handleChange}
          ></Input>

          <p className="body-aside">
            Please ensure the Filecoin address you are providing is correct. If you provide an
            incorrect wallet address, this transaction submission could result in unrecoverable loss
            of some or all of your Filecoin tokens.
          </p>

          <Input
            title="Filecoin Amount"
            unit="FIL"
            type="number"
            name="fil"
            style={{ marginTop: 48 }}
            value={this.state.fil}
            onChange={this._handleChange}
          ></Input>

          <div style={{ marginTop: 24 }}>
            <Button onClick={this._handleSendFilecoin} loading={this.state.loading}>
              Prepare transaction
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
