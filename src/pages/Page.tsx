import './Page.css';
import { Header } from '../components/Header';
import { Navbar } from '../components/Navbar';
import { Networth } from './Networth';

export const Page: React.FC = () => {
    return (
    <div className='page'>
        <div className='page--header'>
            <Header />
        </div>
        <div className="page--content-container">
            <div className='page--navbar scrollable'>
                <Navbar />
            </div>
            <Networth />
        </div>
    </div>
    );
};
