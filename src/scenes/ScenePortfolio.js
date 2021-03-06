import "~/src/scenes/Scene.css";

import * as React from "react";
import * as SVG from "~/src/components/SVG.js";
import * as Utilities from "~/src/common/utilities";

import { ipcRenderer } from "electron";

import Input from "~/src/components/Input";
import Transactions from "~/src/components/Transactions.js";

export default class ScenePortfolio extends React.Component {
  render() {
    console.log(this.props.accounts);

    let balance = 0;
    let transactions = [];
    for (const a of this.props.accounts.addresses) {
      balance = Number(balance) + Number(a.balance);
      if (a.transactions && a.transactions.error) {
        // TODO(jim):
        // Sorry, we need to unify responses across API endpoints and clean this up.
        console.log("Broken transaction write case.");
        continue;
      }

      transactions = [...a.transactions, ...transactions];
    }

    const hasAddresses = this.props.accounts.addresses && !!this.props.accounts.addresses.length;

    console.log(balance);
    console.log(transactions);

    return (
      <div className="scene">
        <div className="body">
          <h1 className="body-heading">Portfolio</h1>
          <p className="body-paragraph" style={{ marginBottom: 48 }}>
            Welcome back! Your Filecoin Balance is spread across{" "}
            {this.props.accounts.addresses.length} addresses and {transactions.length} transactions.
          </p>

          {!hasAddresses ? (
            <div className="body-card" onClick={() => this.props.onNavigate("ADD_ADDRESS")}>
              <h2 className="body-heading-two">Add or create your address</h2>
              <p className="body-paragraph">
                To start using this wallet. Add or create your address.
              </p>
            </div>
          ) : null}
          {balance > 0 ? (
            <React.Fragment>
              <h2 className="body-heading" style={{ marginTop: 24 }}>
                {Utilities.formatAsFilecoinConversion(balance, this.props.price)}
              </h2>
              <p className="body-paragraph">Balance</p>
            </React.Fragment>
          ) : null}
          {transactions.length ? (
            <React.Fragment>
              <h2 className="body-heading-two" style={{ marginTop: 24 }}>
                Transactions
              </h2>
              <Transactions
                accounts={this.props.accounts}
                onGetMessage={this.props.onGetMessage}
                onGetActorCode={this.props.onGetActorCode}
                onDeserializeParams={this.props.onDeserializeParams}
                address={{ transactions }}
              />
            </React.Fragment>
          ) : null}
        </div>
      </div>
    );
  }
}
