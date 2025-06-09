import React from 'react';

const LanguageSelector: React.FC = () => {
    const languages = ['English', 'Chinese', 'Russian', 'Finnish'];
    const [selectedLanguage, setSelectedLanguage] = React.useState<string>(languages[0]);

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLanguage(event.target.value);
        // Add logic to update the application language
    };

    return (
        <div>
            <label htmlFor="language-select">Select Language:</label>
            <select id="language-select" value={selectedLanguage} onChange={handleChange}>
                {languages.map((language) => (
                    <option key={language} value={language}>
                        {language}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;