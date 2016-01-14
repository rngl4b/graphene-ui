import React from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import BalanceComponent from "../Utility/BalanceComponent";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import SettleModal from "../Modal/SettleModal";
import MarketLink from "../Utility/MarketLink";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import CollateralPosition from "../Blockchain/CollateralPosition";
import RecentTransactions from "./RecentTransactions";
import ChainStore from "api/ChainStore";

class AccountOverview extends React.Component {

    constructor(props) {
        super();
        this.state = {
            settleAsset: "1.3.0"
        };
    }

    _onSettleAsset(id, e) {
        e.preventDefault();
        this.setState({
            settleAsset: id
        });

        this.refs.settlement_modal.show();
    }

    render() {
        let {account, settings} = this.props;
        if (!account) {
            return null;
        }
        let call_orders = [];
        if (account.toJS && account.has("call_orders")) call_orders = account.get("call_orders").toJS();
        let balances = [];
        let account_balances = account.get("balances");
        let balanceList = Immutable.List();

        let preferredUnit = settings.get("unit") || "1.3.0";
        if (account_balances) {
            account_balances.forEach( balance => {
                let balanceAmount = ChainStore.getObject(balance);
                if (!balanceAmount.get("balance")) {
                    return null;
                }
                let asset = ChainStore.getObject(balanceAmount.get("asset_type"));
                let isBitAsset = asset && asset.has("bitasset_data_id");

                const core_asset = ChainStore.getAsset("1.3.0");
                let assetInfoLinks = asset && <ul>
                    <li><a href={`#/asset/${asset.get("symbol")}`}><Translate content="account.asset_details"/></a></li>
                    <li><a href={`#/market/${asset.get("symbol")}_${core_asset?core_asset.get("symbol"):"BTS"}`}><Translate content="exchange.market"/></a></li>
                    {isBitAsset && <li><a href onClick={this._onSettleAsset.bind(this, asset.get("id"))}><Translate content="account.settle"/></a></li>}
                </ul>;

                balanceList = balanceList.push(balance);
                balances.push(
                    <tr key={balance} style={{maxWidth: "100rem"}}>
                        {/*isBitAsset ? <td><div onClick={this._onSettleAsset.bind(this, asset.get("id"))} className="button outline"><Translate content="account.settle" /></div></td> : <td></td>*/}
                        <td style={{textAlign: "right"}}><BalanceComponent balance={balance} assetInfo={assetInfoLinks}/></td>
                        {/*<td style={{textAlign: "right"}}><MarketLink.ObjectWrapper object={balance}></MarketLink.ObjectWrapper></td>*/}
                        <td style={{textAlign: "right"}}><BalanceValueComponent balance={balance} toAsset={preferredUnit}/></td>
                        <td style={{textAlign: "right"}}><BalanceComponent balance={balance} asPercentage={true}/></td>
                    </tr>
                );
            })
        }

        let totalBalance = balanceList.size ? <TotalBalanceValue balances={balanceList}/> : null;

        return (
            <div className="grid-content">
                <div className="content-block small-12">
                    <h3><Translate content="transfer.balances" /></h3>
                    <table className="table">
                        <thead>
                            <tr>
                                {/*<th><Translate component="span" content="modal.settle.submit" /></th>*/}
                                <th style={{textAlign: "right"}}><Translate component="span" content="account.asset" /></th>
                                {/*<<th style={{textAlign: "right"}}><Translate component="span" content="account.bts_market" /></th>*/}
                                <th style={{textAlign: "right"}}><Translate component="span" content="account.eq_value" /></th>
                                <th style={{textAlign: "right"}}><Translate component="span" content="account.percent" /></th>
                            </tr>
                        </thead>
                        <tbody>
                            {balances}
                            {balanceList.size > 1 ? <tr>
                                <td></td>
                                <td style={{textAlign: "right"}}>{totalBalance}</td>
                                <td></td>
                            </tr> : null}
                        </tbody>
                    </table>
                    <SettleModal ref="settlement_modal" asset={this.state.settleAsset} account={account.get("name")}/>
                </div>
                {call_orders.length > 0 ? <div className="content-block">
                    <h3><Translate content="account.collaterals" /></h3>
                    <table className="table">
                        <thead>
                        <tr>
                            <th><Translate content="transaction.borrow_amount" /></th>
                            <th><Translate content="transaction.collateral" /></th>
                            <th><Translate content="borrow.coll_ratio" /></th>
                            <th><Translate content="exchange.call" /></th>
                            <th><Translate content="borrow.adjust" /></th>
                            <th><Translate content="borrow.close" /></th>
                        </tr>
                        </thead>
                        <tbody>
                        { call_orders.map(id =><CollateralPosition key={id} object={id} account={account}/>) }
                        </tbody>
                    </table>
                </div> : null}
                <div className="content-block">
                    <RecentTransactions
                        accountsList={Immutable.fromJS([account.get("id")])}
                        compactView={false}
                        showMore={true}
                    />
                </div>
            </div>

        );
    }
}

export default AccountOverview;
