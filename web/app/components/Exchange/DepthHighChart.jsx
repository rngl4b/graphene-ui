import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import Immutable from "immutable";
import Highstock from "react-highcharts/bundle/highstock";
import utils from "common/utils";
import counterpart from "counterpart";
import {cloneDeep} from "lodash";
import Translate from "react-translate-component";

class DepthHighChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.orders, this.props.orders) ||
            !Immutable.is(nextProps.call_orders, this.props.call_orders) ||
            // nextProps.plotLine !== this.props.plotLine ||
            nextProps.feedPrice !== this.props.feedPrice ||
            nextProps.settlementPrice !== this.props.settlementPrice ||
            nextProps.leftOrderBook !== this.props.leftOrderBook ||
            nextProps.SQP !== this.props.SQP ||
            nextProps.LCP !== this.props.LCP ||
            nextProps.showCallLimit !== this.props.showCallLimit
        );
    }

    constructor() {
        super();
        this.state = {offsetHeight: null};
    }

    componentWillReceiveProps() {
        let height = ReactDOM.findDOMNode(this).offsetHeight;
        this.setState({offsetHeight: height - 10});
    }


    render() {
        let {flat_bids, flat_asks, flat_calls, settles, quoteSymbol, baseSymbol, totalBids, totalCalls, spread, base, quote} = this.props;

        let priceSymbol = `${baseSymbol}/${quoteSymbol}`;

        let totalAsks = 0;

        let power = 1;

        let flatBids = cloneDeep(flat_bids), flatAsks = cloneDeep(flat_asks), flatCalls = cloneDeep(flat_calls);

        if (flat_bids.length) {
            while ((flat_bids[flat_bids.length - 1][0] * power) < 1) {
                power *= 10;
            }
        } else if (flat_asks.length) {
            while ((flat_asks[0][0] * power) < 1) {
                power *= 10;
            }
        } else if (flat_calls && flat_calls.length) {
            while ((flat_calls[flat_calls.length - 1][0] * power) < 1) {
                power *= 10;
            }
        }

        power *= 10;

        if (power !== 1) {
            if (flatBids.length) {
                flatBids.forEach(bid => {
                    bid[0] *= power;
                })
            }

            if (flatAsks.length) {
                flatAsks.forEach(ask => {
                    ask[0] *= power;
                })
            }

            if (flatCalls && flatCalls.length) {
                flatCalls.forEach(call => {
                    call[0] *= power;
                })
            }
        }

        let config = {
            chart: {
                type: "area",
                backgroundColor: "rgba(255, 0, 0, 0)",
                spacing: [10, 0, 5, 0]
            },
            title: {
                text: null
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            rangeSelector: {
                enabled: false
            },
            navigator: {
                enabled: false
            },
            scrollbar: {
                enabled: false
            },
            dataGrouping: {
                enabled: false
            },
            tooltip: {
                shared: false,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                formatter: function() {
                    let name = this.series.name.split(" ")[0];
                    return `<span style="font-size: 90%;">${utils.format_number(this.x / power, base.get("precision"))} ${priceSymbol}</span><br/><span style="color:${this.series.color}">\u25CF</span>${name}: <b>${utils.format_number(this.y, base.get("precision"))} ${quoteSymbol}</b>`;
                },
                style: {
                    color: "#FFFFFF"
                }
            },
            series: [],
            yAxis: {
                labels: {
                    enabled: false,
                    style: {
                        color: "#FFFFFF"
                    }
                },
                title: {
                    text: null,
                    style: {
                        color: "#FFFFFF"
                    }
                },
                gridLineWidth: 0,
                crosshair: {
                    snap: false
                },
                currentPriceIndicator: {
                    enabled: false
                }
            },
            xAxis: {
                labels: {
                    style: {
                        color: "#FFFFFF"
                    },
                    formatter: function () {return this.value / power; }
                },
                ordinal: false,
                lineColor: "#000000",
                title: {
                    text: null
                },
                plotLines: []
            },
            plotOptions: {
                area: {
                    animation: false,
                    marker: {
                        enabled: false
                    },
                    series: {
                        fillOpacity: 0.25,
                        enableMouseTracking: false
                    }
                }
            }
        };

        // Total asks value
        if (flat_asks.length > 0) {
            totalAsks = flat_asks[flat_asks.length - 1][1];
        }

        // Center the charts between bids and asks
        if (flatBids.length > 0 && flatAsks.length > 0) {
            let middleValue = (flatAsks[0][0] + flatBids[flatBids.length - 1][0]) / 2;
            let adjustedSpread = spread * power;
            config.xAxis.min = middleValue * 0.45;
            config.xAxis.max = middleValue * 1.55;
            if (adjustedSpread > 0 && adjustedSpread > middleValue) {
                config.xAxis.min = Math.max(0, middleValue - 1.5 * adjustedSpread);
                config.xAxis.max = middleValue + 1.5 * adjustedSpread;
            }
        }

        // Add plotlines if defined
        // if (falsethis.props.plotLine) {
        //     config.xAxis.plotLines.push({
        //         color: "red",
        //         id: "plot_line",
        //         dashStyle: "longdashdot",
        //         value: this.props.plotLine * power,
        //         width: 1,
        //         zIndex: 5
        //     });
        // }

        // Market asset
        if (this.props.LCP) {
            config.xAxis.plotLines.push({
                color: "#B6B6B6",
                id: "plot_line",
                dashStyle: "longdash",
                value: this.props.LCP * power,
                label: {
                    text: counterpart.translate("explorer.block.call_limit"),
                    style: {
                        color: "#DADADA",
                        fontWeight: "bold"
                    }
                },
                width: 2,
                zIndex: 5
            });
        }

        if (this.props.SQP) {
            config.xAxis.plotLines.push({
                color: "#B6B6B6",
                id: "plot_line",
                dashStyle: "longdash",
                value: this.props.SQP * power,
                label: {
                    text: counterpart.translate("exchange.squeeze"),
                    style: {
                        color: "#DADADA",
                        fontWeight: "bold"
                    }
                },
                width: 2,
                zIndex: 5
            });
        }


        if (this.props.settlementPrice) {
            config.xAxis.plotLines.push({
                color: "#7B1616",
                id: "plot_line",
                dashStyle: "solid",
                value: this.props.settlementPrice * power,
                label: {
                    text: counterpart.translate("explorer.block.settlement_price"),
                    style: {
                        color: "#DADADA",
                        fontWeight: "bold"
                    }
                },
                width: 2,
                zIndex: 5
            });


            // Add calls if present
            if (flatCalls && flatCalls.length) {
                config.series.push({
                    name: `Call ${quoteSymbol}`,
                    data: flatCalls,
                    color: "#BBBF2B"
                })
                if (this.props.invertedCalls) {
                    totalAsks += totalCalls;
                } else {
                    totalBids += totalCalls;
                }
            }
        }

        // Add settle orders
        if (this.props.settlementPrice && this.props.settles.size) {
            let settleAsset, amountRatio, inverted;
            if (quote.get("id") === "1.3.0") {
                amountRatio = this.props.settlementPrice;
                settleAsset = base;
                inverted = true;
            } else {
                amountRatio = 1;
                settleAsset = quote;
                inverted = false;
            }

            let flat_settles = this.props.settles.reduce((final, a) => {
                if (!final) {
                    return [[this.props.settlementPrice * power, utils.get_asset_amount(a.balance.amount, settleAsset) / amountRatio]];
                } else {
                    final[0][1] = final[0][1] + utils.get_asset_amount(a.balance.amount, settleAsset) / amountRatio;
                    return final;
                }
            }, null);

            if (inverted) {
                flat_settles.unshift([0, flat_settles[0][1]]);
            } else {
                flat_settles.push([flat_asks[flat_asks.length-1][0] * power, flat_settles[0][1]]);
            }

            config.series.push({
                name: `Settle ${quoteSymbol}`,
                data: flat_settles,
                color: "#4777A0"
            })

        }


        // Push asks and bids
        if (flatBids.length) {
            config.series.push({
                name: `Bid ${quoteSymbol}`,
                data: flatBids,
                color: "#50D2C2"
            })
        }

        if (flatAsks.length) {
            config.series.push({
                name: `Ask ${quoteSymbol}`,
                data: flatAsks,
                color: "#E3745B"
            });
        }

        

        // Fix the height if defined, if not use offsetHeight
        if (this.props.height) {
            config.chart.height = this.props.height;
        } else if (this.state.offsetHeight) {
            config.chart.height = this.state.offsetHeight;
        }

        // Add onClick event listener if defined
        if (this.props.onClick) {
            config.chart.events = {
                click: this.props.onClick.bind(this, power)
            };
        }

        return (
            <div className="grid-content no-overflow middle-content">
                {!flatBids.length && !flatAsks.length && !flatCalls.length ? <span className="no-data"><Translate content="exchange.no_data" /></span> : null}
                <p className="bid-total">{utils.format_number(totalBids, base.get("precision"))} {baseSymbol}</p>
                <p className="ask-total">{utils.format_number(totalAsks, quote.get("precision"))} {quoteSymbol}</p>
                {flatBids || flatAsks || flatCalls ? <Highstock config={config}/> : null}
            </div>
        );
    }
}

DepthHighChart.defaultProps = {
    flat_bids: [],
    flat_asks: [],
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
};

DepthHighChart.propTypes = {
    flat_bids: PropTypes.array.isRequired,
    flat_asks: PropTypes.array.isRequired,
    orders: PropTypes.object.isRequired,
    baseSymbol: PropTypes.string.isRequired,
    quoteSymbol: PropTypes.string.isRequired
};

export default DepthHighChart;
