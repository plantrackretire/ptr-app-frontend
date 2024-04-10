import './Page.css';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Networth } from './Networth';
import { useState } from 'react';
import { IFilterBarValues, filterBarValuesInit } from '../components/FilterBar';

export const Page: React.FC = () => {
    const [filterBarValues, setFilterBarValues] = useState<IFilterBarValues>(filterBarValuesInit);

    console.log("IN PAGE");
    
    return (
        <div className='page'>
            <div className='page--header'>
                <Header />
            </div>
            <div className="page--content-container">
                <div className='page--navbar '>
                    <Navbar filterBarValues={filterBarValues} setFilterBarValues={setFilterBarValues} />
                </div>
                <Networth filterBarValues={filterBarValues} />
            </div>
        </div>
    );
};
