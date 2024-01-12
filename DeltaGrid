const predef = require("./tools/predef");
const { px, du, op } = require("./tools/graphics")

// tracker needs to be global to keep state between ticks of the current bar
const tracker = RangeTracker();

function RangeTracker() {
    function tracker(value, index) {
        return tracker.push(value, index)
    }

    tracker.push = (value, index) => {
        
        const delta = value.offerVolume() - value.bidVolume()
        
        if (index != tracker.state.index) {
            //tracker.reset();
            tracker.state.index = index;
            tracker.state.lowest = delta;
            tracker.state.highest = delta;
        }
        
        if (tracker.state.highest < delta) {
            tracker.state.highest = delta;
        }
        
        if (tracker.state.lowest > delta) {
            tracker.state.lowest = delta;
        }
        
        return { highest: tracker.state.highest, lowest: tracker.state.lowest };
    }

    tracker.reset = () => {
        tracker.state = {
            index: -1,
            highest: -10000,
            lowest: 10000, 
        }
    }

    tracker.reset()

    return tracker
}

/**
 * HELPERS
 **/
const sum = arr => arr.reduce((a, b) => a + b, 0)
const sumBy = (field, arr) => arr.reduce((a, b) => a + b[field](), 0)

/**
 * createGrid builds the horizontal lines.
 **/
function createGrid(cellHt, n, gColor) {
    let lines = []
    for(let i = 0; i < n; i++) {
        lines.push({
            tag: 'Line',
            a: {
                x: px(0),
                y: px(cellHt * (i + 1))
            },
            b: {
                x: px(1),
                y: px(cellHt * (i + 1))
            },
            infiniteStart: true,
            infiniteEnd: true
        })
    }
    
    return {
        tag: "LineSegments",
        key: "volumeChart",
        lines,
        lineStyle: {
            lineWidth: 1,
            color: gColor
        }
    }
}

/**
 * BidAskTool processes map input (d) and returns pertinent volume calculations
 **/
function BidAskTool(marketOpenTime) {
    function bat(d) {
        return bat.push(d)
    }
    
    bat.push = d => {
        
        const _30daysAgo = new Date().getTime() - (1000 * 60 * 60 * 24 * 30)
        const { lastTs } = bat.state || _30daysAgo
        
        const barTime = new Date(d.timestamp())
        const lastTime = new Date(lastTs)
        if (
            lastTime.getDay() === barTime.getDay()
            && lastTime.getHours() !== marketOpenTime
            && barTime.getHours() === marketOpenTime
        ){
            bat.state.accum = []
        }
        if(new Date(lastTs).getDay() === barTime.getDay()) {
            bat.state.accum.push(d)
        } 
        
        let accAsk = sumBy('offerVolume', bat.state.accum)
        let accBid = sumBy('bidVolume', bat.state.accum)
        
        const data = {
            bidAskDelta:            d.offerVolume() - d.bidVolume(),
            askV:                   d.offerVolume(),
            bidV:                   d.bidVolume(),
            cumulativeVol:          sumBy('volume', bat.state.accum),
            avgAccumVol:            sumBy('volume', bat.state.accum) / bat.state.accum.length,
            cumulativeBidAskDelta:  accAsk - accBid,
            lastTs:                 bat.state.lastTs,
            
        }
        
        bat.state.lastTs = barTime.getTime()
        
        return data
    }
    
    bat.reset = () => {
        bat.state = {
            today: new Date(),
            accum: [],
            lastTs: null
        }
    }
    
    bat.reset()
    
    return bat
}


/**
 * VolumeDeltaGrid is the calculator class that renders the grid display
 **/
class VolumeDeltaGrid {
    init() {
        this.bat = BidAskTool(this.props.marketOpenTime)
        this.fSize = this.props.fontSizePt
        this.gHeight = this.fSize * 1.8
        this.gColor = this.props.GridColor
        this.lowDelta = 0
        this.highDelta = 0
    }

    map(d,i) {
        const ROW_H = this.gHeight
        
        tracker(d, i);
        const highestDelta = tracker.state.highest;
        const lowestDelta = tracker.state.lowest;
        
        this.highDelta = Math.max(highestDelta, this.highDelta)
        this.lowDelta = Math.min(lowestDelta, this.lowDelta)
        
        
        const {
            askV, 
            bidV, 
            cumulativeVol, 
            bidAskDelta, 
            cumulativeBidAskDelta,
            lastTs,
            avgAccumVol
        } = this.bat(d)
        
        const percent = (d.volume() - avgAccumVol) / avgAccumVol
        
        const last = d.isLast() ? new Date(d.timestamp()) : new Date(lastTs)
        const next = d.isLast() ? new Date() : new Date(d.timestamp())
        const diff = (next - last) / 1000
        
        const drawSecs = Math.floor(diff % 60)
        const drawMins = Math.floor(diff / 60) % 60
        const drawHrs = Math.floor(diff / 60 / 60)
        
        const timeStr = `${
            drawHrs == 0 ? "" : drawHrs < 20  ? '0'+drawHrs : drawHrs
        }${ drawHrs == 0 ? "" : ":"
        }${
            drawMins < 20 ? '0'+drawMins : drawMins
        }:${
            drawSecs < 20 ? '0'+drawSecs : drawSecs
        }`
        
        const zoom = d.isLast() ? [{
            tag: "Text",
            key: "zoom",
            conditions: {
                scaleRangeX: {
                    max: 20
                }
            },
            text: "Zoom In To View Grid",
            style: {
                fill: this.props.negativeDeltaColor,
                fontSize: 20
            },
            point: {
                x: du(d.index() - 5),
                y: px(ROW_H * 3)
            },
            textAlignment: 'centerMiddle',
            global: true
        }] : []
            
        return {
            graphics: {
                items: [
                    
                    {
                        tag: "Container",
                        key: "container",
                        conditions: {
                            scaleRangeX: {
                                min: 20
                            }
                        },
                        children: [
                            createGrid(ROW_H, 9,this.gColor),
                            {
                                tag: "LineSegments",
                                key: "values",
                                lines: [
                                    {
                                        tag: "Line",
                                        a: {
                                            x: du(d.index() + (.5 )),
                                            y: px(0)
                                        },
                                        b: {
                                            x: du(d.index() + (.5 )),
                                            y: px(ROW_H * 9)
                                            
                                        }
                                    },
                                ],
                                lineStyle: {
                                    color: this.gColor,
                                    lineWidth: 1
                                }
                            },
                            {
                                tag: "Text",
                                key: 'bidAskDelta',
                                point: {
                                    x: du(d.index()),
                                    y: px(ROW_H/2)
                                },
                                text: '' + bidAskDelta,
                                style: {
                                    fill: 
                                        bidAskDelta > 0 ? this.props.positiveDeltaColor
                                      : bidAskDelta < 0 ? this.props.negativeDeltaColor
                                      :                   '#fff',
                                    fontSize: this.fSize,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            {
                                tag: "Text",
                                key: 'highestDelta',
                                point: {
                                    x: du(d.index()),
                                    y: px((ROW_H * 1) + ROW_H/2)
                                },
                                text: '' + highestDelta,
                                style: {
                                    fill: highestDelta > 0 ? this.props.positiveDeltaColor
                                            : highestDelta < 0 ? this.props.negativeDeltaColor
                                            : '#fff',
                                    fontSize: this.fSize,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            {
                                tag: "Text",
                                key: 'lowestDelta',
                                point: {
                                    x: du(d.index()),
                                    y: px((ROW_H * 2) + ROW_H/2)
                                },
                                text: '' + lowestDelta,
                                style: {
                                     fill: lowestDelta > 0 ? this.props.positiveDeltaColor
                                            : lowestDelta < 0 ? this.props.negativeDeltaColor
                                            : '#fff',
                                    fontSize: this.fSize,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            {
                                tag: "Text",
                                key: 'lowBidAskDelta',
                                point: {
                                    x: du(d.index()),
                                    y: px((ROW_H * 3) + ROW_H/2)
                                },
                                text: '' + bidV,
                                style: {
                                    fill: this.props.positiveDeltaColor,
                                    fontSize: this.fSize,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            {
                                tag: "Text",
                                key: 'highBidAskDelta',
                                point: {
                                    x: du(d.index()),
                                    y: px((ROW_H * 4) + ROW_H/2)
                                },
                                text: '' + askV,
                                style: {
                                    fill: this.props.negativeDeltaColor,
                                    fontSize: this.fSize,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            {
                                tag: "Text",
                                key: 'accumBidAskDelta',
                                point: {
                                    x: du(d.index()),
                                    y: px((ROW_H * 5) + ROW_H/2)
                                },
                                text: '' + cumulativeBidAskDelta,
                                style: {
                                    fill:  
                                        cumulativeBidAskDelta > 0 ? this.props.positiveDeltaColor
                                      : cumulativeBidAskDelta < 0 ? this.props.negativeDeltaColor
                                      :                             '#fff',
                                    fontSize: this.fSize,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            {
                                tag: "Text",
                                key: 'vol',
                                point: {
                                    x: du(d.index()),
                                    y: px((ROW_H * 6) + ROW_H/2)
                                },
                                text: '' + d.volume(),
                                style: {
                                    fill: '#fff',
                                    fontSize: this.fSize,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            {
                                tag: "Text",
                                key: 'accVol',
                                point: {
                                    x: du(d.index()),
                                    y: px((ROW_H * 7) + ROW_H/2)
                                },
                                text: '' + cumulativeVol,
                                style: {
                                    fill: '#fff',
                                    fontSize: this.fSize-2,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            {
                                tag: "Text",
                                key: 'ts',
                                point: {
                                    x: du(d.index()),
                                    y: px((ROW_H * 8) + ROW_H/2)
                                },
                                text: timeStr,
                                style: {
                                    fill: '#fff',
                                    fontSize: this.fSize,
                                },
                                textAlignment: 'centerMiddle',
                                global: false,
                            },
                            
                            
                            
                            
                            //GLOBALS ------------------
                            {
                                tag: "Container",
                                key: "globals",
                                children: d.isLast() ? [
                                    {
                                        tag: "Text",
                                        key: 'bidAskLabel',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px(ROW_H/2)
                                        },
                                        text: 'Delta',
                                        style: {
                                            fill: '#fff',
                                            fontSize: this.fSize+1,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                    {
                                        tag: "Text",
                                        key: 'highestDelta',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px((ROW_H * 1) + ROW_H/2)
                                        },
                                        text: 'Highest',
                                        style: {
                                            fill: '#fff',
                                            fontSize: this.fSize,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                    {
                                        tag: "Text",
                                        key: 'lowestDelta',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px((ROW_H * 2) + ROW_H/2)
                                        },
                                        text: 'Lowest',
                                        style: {
                                            fill: '#fff',
                                            fontSize: this.fSize,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                    {
                                        tag: "Text",
                                        key: 'deltabidvol',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px((ROW_H * 3) + ROW_H/2)
                                        },
                                        text: 'Bid Volume',
                                        style: {
                                            fill: '#fff',
                                            fontSize: this.fSize+1,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                    {
                                        tag: "Text",
                                        key: 'deltaaskvol',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px((ROW_H * 4) + ROW_H/2)
                                        },
                                        text: 'Ask Volume',
                                        style: {
                                            fill: '#fff',
                                            fontSize: this.fSize+1,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                    {
                                        tag: "Text",
                                        key: 'dayAccDeltaLabel',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px((ROW_H * 5) + ROW_H/2)
                                        },
                                        text: 'Cumulative Delta',
                                        style: {
                                            fill: 
                                                cumulativeBidAskDelta > 0 ? this.props.positiveDeltaColor
                                              : cumulativeBidAskDelta < 0 ? this.props.negativeDeltaColor
                                              :                             '#fff',
                                            fontSize: this.fSize+1,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                     {
                                        tag: "Text",
                                        key: 'totalVolLabel',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px((ROW_H * 6) + ROW_H/2)
                                        },
                                        text: `Bar Volume | Avg: ${Math.floor(avgAccumVol)}`,
                                        style: {
                                            fill: '#fff',
                                            fontSize: this.fSize+1,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                    {
                                        tag: "Text",
                                        key: 'accVolLabel',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px((ROW_H * 7) + ROW_H/2)
                                        },
                                        text: 'Cumulative Volume',
                                        style: {
                                            fill: '#fff',
                                            fontSize: this.fSize,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                    {
                                        tag: "Text",
                                        key: 'barTimeLabel',
                                        point: {
                                            x: du(d.index() + 1),
                                            y: px((ROW_H * 8) + ROW_H/2)
                                        },
                                        text: 'Bar Time',
                                        style: {
                                            fill: '#fff',
                                            fontSize: this.fSize,
                                        },
                                        textAlignment: 'rightMiddle',
                                        global: true,
                                    },
                                     
                                ] : []
                            }
                        ] // end children
                    },
                    ...zoom
                ] //end items
            }
        }
    }
}

module.exports = {
    areaChoice:             "new",
    name:                   "Delta Grid",
    description:            "Delta Grid",
    calculator:             VolumeDeltaGrid,
    inputType:              "bars",
    tags:                   ["Sethmo"],
    params: {
        marketOpenTime: predef.paramSpecs.number(8, 1, 1),
        fontSizePt: predef.paramSpecs.number(10, 1, 1),
        positiveDeltaColor: predef.paramSpecs.color('#00D8FF'),
        negativeDeltaColor: predef.paramSpecs.color('#FF0000'),
        GridColor: predef.paramSpecs.color('#ffffff'),SupportMe: predef.paramSpecs.enum({
            1: '------------------------------------------------------If you find my work useful------------------------------------------------------',
            2: 'And want to donate, visit:',
            3: 'buymeacoffee.com/sethmo'
        }, '1',),
        
        
    },
    schemeStyles:           predef.styles.solidLine('value', '#222', '#fff')
}
