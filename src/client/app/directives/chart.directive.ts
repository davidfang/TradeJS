import * as _               from 'lodash';
import {Directive, ElementRef, OnInit, Input, AfterViewInit} from '@angular/core';
import {InstrumentModel} from "../models/instrument.model";
import * as moment          from 'moment/moment';

// Themes
import ThemeDefault from './chart-theme/theme.default';
import './chart-theme/theme.dark';
import InstrumentsService from "../services/instruments.service";

const HighStock = require('highcharts/highstock');

@Directive({
    selector: '[chart]',
    exportAs: 'chart'
})

export class ChartDirective implements OnInit, AfterViewInit {

    @Input()
    public model: InstrumentModel;

    public chart: any;

    constructor(
        private _instrumentsService: InstrumentsService,
        private _elementRef: ElementRef) {
    }

    ngOnInit() {

    }

    ngAfterViewInit() {
        this._createChart();

        if (!this.model.data.id) {
            let subscription = this.model.synced.subscribe(() => {
                subscription.unsubscribe();

                this._fetch();
            });
        } else {
            this._fetch();
        }
    }

    public reflow() {
        requestAnimationFrame(() => {
            this.chart.reflow();
        })
    }

    private _createChart(): void {
        // Clone a new settings object
        let settings = _.cloneDeep(ThemeDefault);

        // create the chart
        this.chart = HighStock.stockChart(this._elementRef.nativeElement, settings);
    }

    private async _fetch(from?: number, until?: number) {
        from = moment(new Date()).subtract(7, 'days').valueOf();
        until = Date.now();

        let {bars, indicators} = await this._instrumentsService.fetch(this.model, from, until);

        this._updateBars(bars);

    }

    private _updateBars(_data:any[] = []) {
        // // Hide loading screen
        // // TODO: Dirty
        // this.$elLoadingOverlay.addClass('fade-out');
        //
        // setTimeout(() => {
        //     this.$elLoadingOverlay.remove();
        // }, 400);

        if (!_data || !_data.length)
            return;

        let data = ChartDirective.prepareData(_data),
            last = data.candles[data.candles.length-1];

        this.chart.series[0].setData(data.candles);
        this.chart.xAxis[0].setExtremes(data.candles[data.candles.length-100][0], data.candles[data.candles.length-1][0]);

        this.chart.series[1].setData(data.volume);

        this._setCurrentPricePlot(last);
    }

    private _setCurrentPricePlot(bar) {
        this.chart.yAxis[0].removePlotLine('current-price');

        this.chart.yAxis[0].addPlotLine({
            value: bar[1],
            color: '#939293',
            width: 1,
            id: 'current-price',
            label: {
                text: `<div class="chart-current-price-label" style="background:white;">${bar[1]}</div>`,
                align: 'right',
                x: 5,
                y: 2,
                style: {
                    color: '#000'
                },
                useHTML: true,
                textAlign: 'left'
            }
        });
    }

    updateIndicators(indicators) {
        for (let id in indicators) {
            for (let drawBufferName in indicators[id]) {
                let drawBuffer = indicators[id][drawBufferName];

                let unique = id + '_' + drawBuffer.id;

                // New series
                let series = this.chart.get(unique);

                // Update
                if (series) {
                    alert('series exists!');
                    console.log('SERIES!!!!', series);
                }

                // Create
                else {

                    this.chart.addSeries({
                        type: 'line',
                        name : id,
                        //id: unique,
                        data : drawBuffer.data,
                        color: drawBuffer.style.color,
                        yAxis: 0
                    });
                }
            }
        }
    }

    static prepareData(data:any) {
        let length = data.length,
            volume = new Array(length),
            i = 0;

        for (; i < length; i+=1)
            volume[i] = [
                data[i][0], // Date
                data[i].pop() // Volume
            ];

        return {
            candles: data,
            volume: volume
        };
    }
}