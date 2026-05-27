import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { PokeapiService, PokemonCard } from '../pokeapi/pokeapi.service';

export interface Inventory {
  cartas: PokemonCard[];
  sobres_disponibles: number;
  recargas: number; // Tratado como "PokéCoins" en el frontend
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private supabase = inject(SupabaseService);
  private pokeapi = inject(PokeapiService);

  async getInventory(): Promise<Inventory> {
    const { data: userAuth } = await this.supabase.auth.getUser();
    if (!userAuth.user) throw new Error("No autenticado");

    const userId = userAuth.user.id;
    let { data, error } = await this.supabase.client
      .from('inventario')
      .select('cartas, sobres_disponibles, recargas')
      .eq('id_usuario', userId)
      .single();

    const gengarLegendary: PokemonCard = {
      instanceId: 'gengar-legendario-unique-id',
      id: 94,
      name: 'GENGAR LEGENDARIO',
      image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
      types: ['ghost', 'poison'],
      attack: 1600,
      defense: 1000,
      hp: 2000,
      maxHp: 2000,
      specialAbility: 'Control Mental (Sube ATK/DEF)',
      rarity: 'Legendaria',
      description: 'Edición Legendaria Limitada. Se esconde en las sombras de la gente por la noche y absorbe su calor.',
      level: 1
    };

    if (error || !data) {
      // Create new inventory with 3 free packs, Gengar Legendary, and 150 coins
      const newInv = {
        id_usuario: userId,
        cartas: [gengarLegendary],
        sobres_disponibles: 3,
        recargas: 150 // Darles 150 PokéCoins iniciales gratis
      };
      await this.supabase.client.from('inventario').insert(newInv);
      return { cartas: [gengarLegendary], sobres_disponibles: 3, recargas: 150 };
    }

    // Si ya existe inventario, verificar si tiene a Gengar Legendario
    const currentCartas: PokemonCard[] = data.cartas || [];
    const hasGengar = currentCartas.some(c => c.id === 94 && c.rarity === 'Legendaria');
    if (!hasGengar) {
      currentCartas.push(gengarLegendary);
      await this.supabase.client.from('inventario')
        .update({ cartas: currentCartas })
        .eq('id_usuario', userId);
    }

    return {
      cartas: currentCartas,
      sobres_disponibles: data.sobres_disponibles,
      recargas: data.recargas
    };
  }

  async openPack(): Promise<PokemonCard[]> {
    const inv = await this.getInventory();
    if (inv.sobres_disponibles <= 0) throw new Error("No tienes sobres disponibles.");

    // Obtener 5 cartas nuevas de la PokeAPI
    const newCards = await this.pokeapi.getRandomPokemonCards(5);
    
    const { data: userAuth } = await this.supabase.auth.getUser();
    if (!userAuth.user) throw new Error("No autenticado");

    const updatedCards = [...inv.cartas];
    const cardsToReturn: PokemonCard[] = [];

    for (const newCard of newCards) {
      // Buscar si el jugador ya tiene este Pokémon en su inventario
      const existingIdx = updatedCards.findIndex(c => c.name.toLowerCase() === newCard.name.toLowerCase());
      if (existingIdx >= 0) {
        const existingCard = updatedCards[existingIdx];
        existingCard.level = (existingCard.level || 1) + 1;
        existingCard.attack = (existingCard.attack || 0) + 15;
        existingCard.defense = (existingCard.defense || 0) + 10;
        existingCard.hp = (existingCard.hp || 0) + 40;
        existingCard.maxHp = existingCard.hp; // Mantener sincronizada la vida máxima
        cardsToReturn.push({ ...existingCard });
      } else {
        newCard.level = 1;
        newCard.maxHp = newCard.hp;
        updatedCards.push(newCard);
        cardsToReturn.push(newCard);
      }
    }

    await this.supabase.client.from('inventario')
      .update({
        cartas: updatedCards,
        sobres_disponibles: inv.sobres_disponibles - 1
      })
      .eq('id_usuario', userAuth.user.id);

    return cardsToReturn;
  }

  async buyPackWithCoins(): Promise<void> {
    const inv = await this.getInventory();
    const { data: userAuth } = await this.supabase.auth.getUser();
    if (!userAuth.user) throw new Error("No autenticado");

    if (inv.recargas < 100) {
      throw new Error("Saldo de PokéCoins insuficiente. Cuesta 100 PokéCoins.");
    }

    await this.supabase.client.from('inventario')
      .update({
        recargas: inv.recargas - 100,
        sobres_disponibles: inv.sobres_disponibles + 1
      })
      .eq('id_usuario', userAuth.user.id);
  }

  async addWinRewards(isOnline: boolean): Promise<{ coinsEarned: number, packEarned: boolean }> {
    const inv = await this.getInventory();
    const { data: userAuth } = await this.supabase.auth.getUser();
    if (!userAuth.user) throw new Error("No autenticado");

    // Win vs AI = 50 Coins. Win Online = 100 Coins.
    const coinsEarned = isOnline ? 100 : 50;
    const newCoins = inv.recargas + coinsEarned;

    await this.supabase.client.from('inventario')
      .update({
        recargas: newCoins
      })
      .eq('id_usuario', userAuth.user.id);

    return { coinsEarned, packEarned: false };
  }
}
