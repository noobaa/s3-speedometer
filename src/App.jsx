import React from 'react';
import './App.scss';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

export default class App extends React.Component {

    state = {
        history: []
    };

    componentDidMount() {
        this.update();
    }

    async update() {
        try {
            const res = await fetch('/api/fetch');
            const state = await res.json();
            this.setState(state);
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.update(), 1000);
    }

    render() {
        const { history, name } = this.state;
        console.warn(history);
        return (
            <div className="App">
                <h1>{name}</h1>
                <AreaChart
                    width={400}
                    height={400}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        name='Time'
                        dataKey='time'
                        type='number'
                        scale='time'
                        domain={['dataMin', 'dataMax']}
                        interval={0}
                        tickCount={history.length + 1}
                        tickFormatter={t => new Date(t).getSeconds()}
                        label={{
                            value: 'Time (seconds)',
                            offset: -15,
                            position: 'insideBottom'
                        }}
                    />
                    <YAxis
                        name='mbps'
                        dataKey='mbps'
                        type='number'
                        domain={[0, dataMax => {
                            if (dataMax < 10) return 10;
                            return Math.ceil(dataMax / 100) * 100;
                        }]}
                        interval={0}
                        tickCount={11}
                        label={{
                            value: 'MB / sec',
                            angle: -90,
                            offset: 15,
                            position: 'insideLeft'
                        }}
                    />
                    <Area
                        dataKey="mbps"
                        type="monotone"
                        stroke="#ff00ff"
                        fill="#ff00ff"
                    />
                    {false && <Legend />}
                    <Tooltip />
                </AreaChart>
            </div>
        );
    }
}
