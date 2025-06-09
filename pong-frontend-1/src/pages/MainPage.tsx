import React from 'react';
import GamePlaceholder from '../components/Game/GamePlaceholder';
import Menu from '../components/Menu/Menu';

const MainPage: React.FC = () => {
    return (
        <div>
            <Menu />
            <GamePlaceholder />
        </div>
    );
};

export default MainPage;