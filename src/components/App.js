import "~/src/scenes/Scene.css";
import "~/src/components/App.css";
import "~/src/components/Body.css";

import { FilecoinNumber } from "@glif/filecoin-number";
//import signing from "@zondax/filecoin-signing-tools";
import { ipcRenderer } from "electron";
import * as React from "react";
import * as Utilities from "~/src/common/utilities";
import * as SVG from "~/src/components/SVG.js";
import SceneAddAddress from "~/src/scenes/SceneAddAddress";
import SceneAddAddressLedger from "~/src/scenes/SceneAddAddressLedger";
import SceneAddAddressPublic from "~/src/scenes/SceneAddAddressPublic";
import SceneAddress from "~/src/scenes/SceneAddress";
import ScenePortfolio from "~/src/scenes/ScenePortfolio";
import SceneSendFilecoin from "~/src/scenes/SceneSendFilecoin";
import SceneSendFilecoinConfirm from "~/src/scenes/SceneSendFilecoinConfirm";
import SceneTransactions from "~/src/scenes/SceneTransactions";

const WALLET_ADDRESS_TYPES = {
  1: "BLS",
  2: "Multi Signature",
  3: "SECP-256K1",
};

const WALLET_ADDRESS_TYPES_SVG = {
  1: <SVG.BLS height="20px" />,
  2: <SVG.MULTISIG height="20px" />,
  3: <SVG.SECP height="20px" />,
};

const WALLET_SCENE = {
  PORTFOLIO: <ScenePortfolio />,
  ADD_ADDRESS: <SceneAddAddress />,
  ADD_ADDRESS_PUBLIC: <SceneAddAddressPublic />,
  ADD_ADDRESS_LEDGER: <SceneAddAddressLedger />,
  SEND: <SceneSendFilecoin />,
  SEND_CONFIRM: <SceneSendFilecoinConfirm />,
  TRANSACTIONS: <SceneTransactions />,
  ADDRESS: <SceneAddress />,
};

export default class App extends React.Component {
  state = {
    currentScene: "ADD_ADDRESS",
    accounts: { addresses: [] },
    context: null,
  };

  getScene = (scene) => {
    const next = WALLET_SCENE[scene];

    if (next) {
      return next;
    }

    return <div className="root-right"></div>;
  };

  async componentDidMount() {
    await this.update();
  }

  update = async (currentScene) => {
    const accounts = await ipcRenderer.invoke("get-accounts");
    const settings = await ipcRenderer.invoke("get-settings");
    const config = await ipcRenderer.invoke("get-config");

    console.log({ accounts, settings, config });

    this.setState({
      accounts,
      settings,
      config,
      currentScene: currentScene ? currentScene : this.state.currentScene,
    });
  };

  _handleNavigate = (currentScene, newContext = {}) => {
    console.log("navigate", currentScene, newContext);
    if (currentScene === this.state.currentScene) {
      this.setState({ context: { ...newContext } });
      return;
    }

    this.setState({
      currentScene,
      context: { ...newContext },
    });
  };

  _handleRefreshAddress = async ({ address }) => {
    const data = await ipcRenderer.invoke("get-balance", address);
    if (!data.balance) {
      alert("This address was not found on the network. Try again later.");
      return null;
    }

    const addresses = this.state.accounts.addresses.map((each) => {
      if (address === each.address) {
        return {
          ...each,
          ...data,
        };
      }

      return each;
    });

    await ipcRenderer.invoke("write-accounts", { addresses });

    await this.update();

    alert("refreshed");
  };

  _handleAddPublicAddress = async (entry, nextNavigation) => {
    if (!entry.address) {
      alert("No address to add.");
      return null;
    }

    const data = await ipcRenderer.invoke("get-balance", entry.address);
    if (!data.balance) {
      alert("This address was not found on the network. Try again later.");
      return null;
    }

    const addresses = [
      { alias: entry.address, transactions: [], ...entry, ...data },
      ...this.state.accounts.addresses,
    ];
    await ipcRenderer.invoke("write-accounts", { addresses });

    await this.update(nextNavigation);
  };

  _handleSendFilecoin = async ({ source, destination, fil }) => {
    console.log({ source, destination, fil });

    // TODO(why): Pass what you need over to confirm here.
    console.log("Jeromy handle pre confirmation stuff here ...");
    this._handleNavigate("SEND_CONFIRM", { source, destination, fil });
  };

  _handleConfirmSendFilecoin = async ({ source, destination, fil }) => {
    const actor = await ipcRenderer.invoke("get-actor", source);

    let num = new FilecoinNumber(fil, "FIL");
    let msg = {
      from: source,
      to: destination,
      value: num.toAttoFil(),
      nonce: actor.nonce,
    };

    console.log(msg);

    let estim = await ipcRenderer.invoke("estimate-gas", msg);

    console.log(estim);

    let path = "m/44'/461'/0'/0/0";
    let resp = await ipcRenderer.invoke("sign-message", { kind: "ledger", path: path }, estim);
    //console.log("serialized: ", signing.transactionSerialize(estim));

    console.log("Message CID: ", resp.result);

    // TODO(why): Complete, then navigate away here.
    // this._handleNavigate("ADDRESS", { address: source });
  };

  _handleDeleteAddress = async ({ address }) => {
    const addresses = [...this.state.accounts.addresses].filter((each) => each.address !== address);

    await ipcRenderer.invoke("write-accounts", { addresses });

    await this.update("PORTFOLIO");
  };

  render() {
    const nextScene = this.getScene(this.state.currentScene);

    // NOTE(jim):
    // Pass local props to the scene component.
    const sceneElement = React.cloneElement(nextScene, {
      onNavigate: this._handleNavigate,
      onRefreshAddress: this._handleRefreshAddress,
      onAddPublicAddress: this._handleAddPublicAddress,
      onDeleteAddress: this._handleDeleteAddress,
      onSendFilecoin: this._handleSendFilecoin,
      onConfirmSendFilecoin: this._handleConfirmSendFilecoin,
      onUpdate: this.update,
      accounts: this.state.accounts,
      config: this.state.config,
      settings: this.state.settings,
      context: this.state.context,
      currentScene: this.state.currentScene,
    });

    const portfolioClassNames = Utilities.classNames(
      "navigation-item",
      this.state.currentScene === "PORTFOLIO" ? "navigation-item--active" : null
    );
    const addClassNames = Utilities.classNames(
      "navigation-item",
      this.state.currentScene === "ADD_ADDRESS" ? "navigation-item--active" : null
    );
    const sendClassNames = Utilities.classNames(
      "navigation-item",
      this.state.currentScene === "SEND" ? "navigation-item--active" : null
    );
    const transactionsClassNames = Utilities.classNames(
      "navigation-item",
      this.state.currentScene === "TRANSACTIONS" ? "navigation-item--active" : null
    );

    return (
      <React.Fragment>
        <div className="root">
          <div className="root-left">
            <div className="root-left-title">Addresses</div>
            {this.state.accounts.addresses.map((each) => {
              const iconElement = WALLET_ADDRESS_TYPES_SVG[each.type];
              console.log(each);

              return (
                <div
                  className="wallet-item"
                  key={each.address}
                  onClick={() => this._handleNavigate("ADDRESS", { address: each.address })}
                >
                  {iconElement ? <span className="wallet-item-left">{iconElement}</span> : null}{" "}
                  <p className="wallet-item-right">{each.address}</p>
                </div>
              );
            })}
          </div>
          <div className="root-right">
            <div className="root-top">
              <span
                className={portfolioClassNames}
                onClick={() => this._handleNavigate("PORTFOLIO")}
              >
                Portfolio
              </span>
              <span className={addClassNames} onClick={() => this._handleNavigate("ADD_ADDRESS")}>
                Add
              </span>
              <span className={sendClassNames} onClick={() => this._handleNavigate("SEND")}>
                Send
              </span>
              <span
                className={transactionsClassNames}
                onClick={() => this._handleNavigate("TRANSACTIONS")}
              >
                Transactions
              </span>
            </div>
            {sceneElement}
          </div>
        </div>
      </React.Fragment>
    );
  }
}
