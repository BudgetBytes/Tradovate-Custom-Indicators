
const predef = require("./tools/predef");
const meta = require("./tools/meta");

class deltaDivergence {
    init() {
        this.cumCvd = 0;
    }
    
    map(d, i, history) {
        let bearishDivergence;
        let bullishDivergence;
        const tickSize = this.contractInfo.tickSize;
        if(i > 0){
            const deltaValue = d.offerVolume() - d.bidVolume();
            const currentHigh = d.high();
            const currentLow = d.low();
            const prevDeltaValue = history.prior().offerVolume() - history.prior().bidVolume();
            const prevHigh = history.prior().high();
            const prevLow = history.prior().low();
            const isBullish = (history.prior().close() - history.prior().open()) >= 0;
    
            if (isBullish && prevDeltaValue > 0 && prevHigh >= currentHigh && this.cumCvd < (this.cumCvd + deltaValue)){
                bearishDivergence = d.high() + (tickSize * this.props.plotInTick);
            }

            if(!isBullish && prevDeltaValue < 0 && prevLow <= currentLow && this.cumCvd > (this.cumCvd + deltaValue)){
                bullishDivergence = d.low() - (tickSize * this.props.plotInTick);
            }
            this.cumCvd += deltaValue;
        }
        
        return{
            bearishDivergence,
            bullishDivergence
        };
    }
}

module.exports = {
    name: "hiddenDivergence",
    title: "Hidden CVD Divergence",
    description: "Hidden CVD Divergence",
    calculator: deltaDivergence,
    params: {
        plotInTick: predef.paramSpecs.number(2)
    },
    tags: [predef.tags.Volumes],
    inputType: meta.InputType.BARS,
    plotter: [
        predef.plotters.dots('bearishDivergence'),
        predef.plotters.dots('bullishDivergence')
    ],
    plots: {
        bearishDivergence: { title: 'Bearish Divergence', displayOnly: true },
        bullishDivergence: { title: 'Bullish Divergence', displayOnly: true }
    },
    schemeStyles: {
        dark: {
            bearishDivergence: {color: "red"},
            bullishDivergence: {color: "green"}
        }
    }
};
