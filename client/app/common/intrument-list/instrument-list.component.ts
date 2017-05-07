import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import {SocketService} from '../../services/socket.service';
import {InstrumentsService} from '../../services/instruments.service';

@Component({
	selector: 'instrument-list',
	templateUrl: './instrument-list.component.html',
	styleUrls: ['./instrument-list.component.scss']
})

export class InstrumentListComponent implements OnInit, OnDestroy {

	@Input() instruments: Array<string> = [];

	private data: any = {};

	constructor(protected socketService: SocketService,
				protected instrumentsService: InstrumentsService) {
	}

	ngOnInit() {
		this.onTick = this.onTick.bind(this);

		this.socketService.socket.on('tick', this.onTick.bind(this));

		this.socketService.socket.emit('instrument:list', {}, (err, instrumentList) => {
			if (instrumentList)
				this.instruments = instrumentList.map(instrument => instrument.instrument);
		});
	}

	onTick(tick) {
		tick.direction = this.data[tick.instrument] && this.data[tick.instrument].bid > tick.bid ? 'down' : 'up';

		this.data[tick.instrument] = tick;
	}


	updatePrice() {

	}

	ngOnDestroy() {
		this.socketService.socket.off('tick', this.onTick);
	}
}