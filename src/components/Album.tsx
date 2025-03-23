import { useState } from 'react';
import './Album.css';

interface Card {
  id: number;
  image: string;
  isCollected: boolean;
  name: string;
  count: number;
  isRare: boolean;
}

interface Pack {
  id: number;
  cards: Card[];
}

// Lista dei Pokémon rari (prima generazione)
const RARE_POKEMON = [
  { id: 25, name: 'pikachu' },
  { id: 6, name: 'charizard' },
  { id: 150, name: 'mewtwo' },
  { id: 149, name: 'dragonite' },
  { id: 3, name: 'venusaur' },
  { id: 9, name: 'blastoise' },
  { id: 38, name: 'ninetales' },
  { id: 94, name: 'gengar' },
  { id: 131, name: 'lapras' },
  { id: 144, name: 'articuno' },
  { id: 145, name: 'zapdos' },
  { id: 146, name: 'moltres' }
];

const CARDS_PER_PAGE = 12; // Aumentato da 9 a 12 carte per pagina
const TOTAL_PAGES = 15; // Numero totale di pagine per contenere tutti i Pokémon

export const Album = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [showPack, setShowPack] = useState(false);
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [packsOpened, setPacksOpened] = useState(0);
  const [rareCardPosition, setRareCardPosition] = useState<number | null>(null);

  const isRarePokemon = (id: number) => {
    return RARE_POKEMON.some(pokemon => pokemon.id === id);
  };

  const getRandomPokemonId = (position: number) => {
    // Se è il terzo pacchetto e questa è la posizione del Pokémon raro
    if (packsOpened > 0 && packsOpened % 3 === 0 && position === rareCardPosition) {
      const randomRare = RARE_POKEMON[Math.floor(Math.random() * RARE_POKEMON.length)];
      return randomRare.id;
    }
    
    // Altrimenti, generiamo un Pokémon casuale
    return Math.floor(Math.random() * 151) + 1;
  };

  const generateNewPack = async () => {
    setIsOpening(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Determina la posizione del Pokémon raro (0-3)
    const rarePos = Math.floor(Math.random() * 4);
    setRareCardPosition(rarePos);
    
    const newCards = await Promise.all(
      Array.from({ length: 4 }, async (_, index) => {
        const pokemonId = getRandomPokemonId(index);
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        const data = await response.json();
        return {
          id: pokemonId,
          image: data.sprites.front_default,
          name: data.name,
          isCollected: false,
          count: 0,
          isRare: isRarePokemon(pokemonId)
        };
      })
    );

    const newPack: Pack = {
      id: packs.length + 1,
      cards: newCards
    };
    setPacks([...packs, newPack]);
    setCurrentPack(newPack);
    setCurrentCardIndex(0);
    setShowPack(true);
    setPacksOpened(prev => prev + 1);
    setIsOpening(false);
  };

  const isCardDuplicate = (cardId: number) => {
    return cards.some(card => card.id === cardId);
  };

  const handleCardChoice = (keep: boolean) => {
    if (!currentPack) return;

    if (keep) {
      const cardToCollect = currentPack.cards[currentCardIndex];
      setCards(prevCards => {
        const existingCardIndex = prevCards.findIndex(card => card.id === cardToCollect.id);
        
        if (existingCardIndex >= 0) {
          const updatedCards = [...prevCards];
          updatedCards[existingCardIndex] = {
            ...updatedCards[existingCardIndex],
            count: updatedCards[existingCardIndex].count + 1
          };
          return updatedCards;
        }
        
        return [...prevCards, { ...cardToCollect, count: 1 }];
      });
    }

    if (currentCardIndex < 3) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setShowPack(false);
      setCurrentPack(null);
      setRareCardPosition(null);
    }
  };

  const renderAlbumPage = (pageNumber: number) => {
    const startIndex = (pageNumber - 1) * CARDS_PER_PAGE;
    const pageCards = cards.slice(startIndex, startIndex + CARDS_PER_PAGE);
    
    return (
      <div className="album-page">
        {Array.from({ length: CARDS_PER_PAGE }, (_, index) => {
          const card = pageCards[index];
          return (
            <div key={index} className="card-slot">
              {card ? (
                <div className="card-container">
                  <img src={card.image} alt={card.name} className="card-image" />
                  <div className="card-info">
                    <span className="card-name">{card.name}</span>
                    {card.count > 1 && (
                      <span className="card-count">x{card.count}</span>
                    )}
                    {card.isRare && (
                      <span className="rare-badge">Raro</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-slot">?</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="album-container">
      <div className="controls">
        <div className="pack-info">
          <button onClick={generateNewPack} disabled={isOpening}>
            {isOpening ? 'Apertura in corso...' : 'Apri Pacchetto'}
          </button>
          <span className="pack-counter">Pacchetti aperti: {packsOpened}</span>
        </div>
        <div className="page-controls">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>Pagina Precedente</button>
          <span>Pagina {currentPage} di {TOTAL_PAGES}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(TOTAL_PAGES, prev + 1))}>Pagina Successiva</button>
        </div>
      </div>

      <div className="album">
        {renderAlbumPage(currentPage)}
      </div>

      {showPack && currentPack && (
        <div className="pack-overlay">
          <div className="pack-content">
            <h2>Carta {currentCardIndex + 1} di 4</h2>
            <div className="pack-card">
              <div className="card-wrapper">
                <img src={currentPack.cards[currentCardIndex].image} alt={currentPack.cards[currentCardIndex].name} />
                {isCardDuplicate(currentPack.cards[currentCardIndex].id) && (
                  <div className="duplicate-banner">Duplicata!</div>
                )}
                {currentPack.cards[currentCardIndex].isRare && (
                  <div className="rare-banner">Pokémon Raro!</div>
                )}
              </div>
              <span className="pokemon-name">{currentPack.cards[currentCardIndex].name}</span>
              <div className="choice-buttons">
                <button onClick={() => handleCardChoice(false)} className="reject-button">Non Tenere</button>
                <button onClick={() => handleCardChoice(true)} className="accept-button">Tenere</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 