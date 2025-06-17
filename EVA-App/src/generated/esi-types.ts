/**
 * ESI API TypeScript Interfaces
 * Generated from EVE Online ESI Swagger Specification v1.33
 * https://esi.evetech.net/latest/swagger.json
 */

// Base ESI Response Types
export interface EsiError {
  error: string;
  sso_status?: number;
  timeout?: number;
}

export interface EsiHeaders {
  'Cache-Control'?: string;
  'ETag'?: string;
  'Expires'?: string;
  'Last-Modified'?: string;
  'X-Pages'?: number;
}

// ==============================
// MARKET ENDPOINTS (High Priority)
// ==============================

export interface CharacterMarketOrder {
  duration: number;
  escrow?: number;
  is_buy_order?: boolean;
  is_corporation: boolean;
  issued: string;
  location_id: number;
  min_volume?: number;
  order_id: number;
  price: number;
  range: 'station' | 'region' | 'solarsystem' | '1' | '2' | '3' | '4' | '5' | '10' | '20' | '30' | '40';
  region_id: number;
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

export interface CharacterMarketOrderHistory {
  duration: number;
  escrow?: number;
  is_buy_order?: boolean;
  is_corporation: boolean;
  issued: string;
  location_id: number;
  min_volume: number;
  order_id: number;
  price: number;
  range: 'station' | 'region' | 'solarsystem' | '1' | '2' | '3' | '4' | '5' | '10' | '20' | '30' | '40';
  region_id: number;
  state: 'cancelled' | 'expired';
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

export interface RegionalMarketOrder {
  duration: number;
  is_buy_order: boolean;
  issued: string;
  location_id: number;
  min_volume: number;
  order_id: number;
  price: number;
  range: 'station' | 'region' | 'solarsystem' | '1' | '2' | '3' | '4' | '5' | '10' | '20' | '30' | '40';
  system_id: number;
  type_id: number;
  volume_remain: number;
  volume_total: number;
}

export interface MarketPrice {
  adjusted_price?: number;
  average_price?: number;
  type_id: number;
}

export interface MarketHistory {
  average: number;
  date: string;
  highest: number;
  lowest: number;
  order_count: number;
  volume: number;
}

// ==============================
// WALLET ENDPOINTS (High Priority)
// ==============================

export interface WalletJournal {
  amount?: number;
  balance?: number;
  context_id?: number;
  context_id_type?: 'structure_id' | 'station_id' | 'market_transaction_id' | 'character_id' | 'corporation_id' | 'alliance_id' | 'eve_system' | 'industry_job_id' | 'contract_id' | 'planet_id' | 'system_id' | 'type_id';
  date: string;
  description: string;
  first_party_id?: number;
  id: number;
  reason?: string;
  ref_type: 'acceleration_gate_fee' | 'advertisement_listing_fee' | 'agent_donation' | 'agent_location_services' | 'agent_miscellaneous' | 'agent_mission_collateral_paid' | 'agent_mission_collateral_refunded' | 'agent_mission_reward' | 'agent_mission_reward_corporation_tax' | 'agent_mission_time_bonus_reward' | 'agent_mission_time_bonus_reward_corporation_tax' | 'agent_security_services' | 'agent_services_rendered' | 'agents_preward' | 'alliance_maintainance_fee' | 'alliance_registration_fee' | 'asset_safety_recovery_tax' | 'bounty' | 'bounty_prize' | 'bounty_prize_corporation_tax' | 'bounty_prizes' | 'bounty_reimbursement' | 'bounty_surcharge' | 'brokers_fee' | 'clone_activation' | 'clone_transfer' | 'contraband_fine' | 'contract_auction_bid' | 'contract_auction_bid_corp' | 'contract_auction_bid_refund' | 'contract_auction_sold' | 'contract_brokers_fee' | 'contract_brokers_fee_corp' | 'contract_collateral' | 'contract_collateral_deposited_corp' | 'contract_collateral_payout' | 'contract_collateral_refund' | 'contract_deposit' | 'contract_deposit_corp' | 'contract_deposit_refund' | 'contract_deposit_sales_tax' | 'contract_price' | 'contract_price_payment_corp' | 'contract_reversal' | 'contract_reward' | 'contract_reward_deposited' | 'contract_reward_deposited_corp' | 'contract_reward_refund' | 'contract_sales_tax' | 'copying' | 'corporate_reward_payout' | 'corporate_reward_tax' | 'corporation_account_withdrawal' | 'corporation_bulk_payment' | 'corporation_dividend_payment' | 'corporation_liquidation' | 'corporation_logo_change_cost' | 'corporation_payment' | 'corporation_registration_fee' | 'courier_mission_escrow' | 'cspa' | 'cspaofflinerefund' | 'daily_challenge_reward' | 'datacore_fee' | 'dna_modification_fee' | 'docking_fee' | 'duel_wager_escrow' | 'duel_wager_payment' | 'duel_wager_refund' | 'ess_escrow_transfer' | 'external_trade_delivery' | 'external_trade_freeze' | 'external_trade_thaw' | 'factory_slot_rental_fee' | 'gm_cash_transfer' | 'industry_job_tax' | 'infrastructure_hub_maintenance' | 'inheritance' | 'insurance' | 'item_trader_payment' | 'jump_clone_activation_fee' | 'jump_clone_installation_fee' | 'kill_right_fee' | 'lp_store' | 'manufacturing' | 'market_escrow' | 'market_fine_paid' | 'market_provider_tax' | 'market_transaction' | 'medal_creation' | 'medal_issued' | 'mission_completion' | 'mission_cost' | 'mission_expiration' | 'mission_reward' | 'office_rental_fee' | 'operation_bonus' | 'opportunity_reward' | 'planetary_construction' | 'planetary_export_tax' | 'planetary_import_tax' | 'player_donation' | 'player_trading' | 'project_discovery_reward' | 'project_discovery_tax' | 'reaction' | 'release_of_impounded_property' | 'repair_bill' | 'reprocessing_tax' | 'research' | 'resource_wars_reward' | 'reverse_engineering' | 'security_processing_fee' | 'shares' | 'skill_purchase' | 'sovereignity_bill' | 'store_purchase' | 'store_purchase_refund' | 'structure_gate_jump' | 'transaction_tax' | 'upkeep_adjustment_fee' | 'war_ally_contract' | 'war_fee' | 'war_fee_surrender';
  second_party_id?: number;
  tax?: number;
  tax_receiver_id?: number;
}

export interface WalletTransaction {
  client_id: number;
  date: string;
  is_buy: boolean;
  is_personal: boolean;
  journal_ref_id: number;
  location_id: number;
  quantity: number;
  transaction_id: number;
  type_id: number;
  unit_price: number;
}

// ==============================
// INDUSTRY ENDPOINTS (High Priority)
// ==============================

export interface IndustryJob {
  activity_id: number;
  blueprint_id: number;
  blueprint_location_id: number;
  blueprint_type_id: number;
  completed_character_id?: number;
  completed_date?: string;
  cost?: number;
  duration: number;
  end_date: string;
  facility_id: number;
  installer_id: number;
  job_id: number;
  licensed_runs?: number;
  location_id: number;
  output_location_id: number;
  pause_date?: string;
  probability?: number;
  product_type_id?: number;
  runs: number;
  start_date: string;
  station_id: number;
  status: 'active' | 'cancelled' | 'delivered' | 'paused' | 'ready' | 'reverted';
  successful_runs?: number;
}

export interface MiningLedger {
  character_id: number;
  date: string;
  last_updated: string;
  quantity: number;
  recorded_corporation_id: number;
  solar_system_id: number;
  type_id: number;
}

export interface IndustryFacility {
  facility_id: number;
  owner_id: number;
  region_id: number;
  solar_system_id: number;
  tax?: number;
  type_id: number;
}

export interface IndustrySystem {
  cost_indices: Array<{
    activity: 'copying' | 'duplicating' | 'invention' | 'manufacturing' | 'none' | 'reaction' | 'researching_material_efficiency' | 'researching_technology' | 'researching_time_efficiency' | 'reverse_engineering';
    cost_index: number;
  }>;
  solar_system_id: number;
}

// ==============================
// CONTRACTS ENDPOINTS (Medium Priority)
// ==============================

export interface Contract {
  acceptor_id?: number;
  assignee_id?: number;
  availability: 'public' | 'personal' | 'corporation' | 'alliance';
  buyout?: number;
  collateral?: number;
  contract_id: number;
  date_accepted?: string;
  date_completed?: string;
  date_expired: string;
  date_issued: string;
  days_to_complete?: number;
  end_location_id?: number;
  for_corporation?: boolean;
  issuer_corporation_id: number;
  issuer_id: number;
  price?: number;
  reward?: number;
  start_location_id?: number;
  status: 'outstanding' | 'in_progress' | 'finished_issuer' | 'finished_contractor' | 'finished' | 'cancelled' | 'rejected' | 'failed' | 'deleted' | 'reversed';
  title?: string;
  type: 'unknown' | 'item_exchange' | 'auction' | 'courier' | 'loan';
  volume?: number;
}

export interface ContractItem {
  is_blueprint_copy?: boolean;
  is_included: boolean;
  item_id?: number;
  material_efficiency?: number;
  quantity: number;
  raw_quantity?: number;
  record_id: number;
  runs?: number;
  time_efficiency?: number;
  type_id: number;
}

export interface ContractBid {
  amount: number;
  bid_id: number;
  bidder_id: number;
  date_bid: string;
}

// ==============================
// MAIL ENDPOINTS (Medium Priority)
// ==============================

export interface MailHeader {
  from?: number;
  is_read?: boolean;
  labels?: number[];
  mail_id?: number;
  recipients?: Array<{
    recipient_id: number;
    recipient_type: 'alliance' | 'character' | 'corporation' | 'mailing_list';
  }>;
  subject?: string;
  timestamp?: string;
}

export interface Mail {
  body?: string;
  from?: number;
  labels?: number[];
  read?: boolean;
  recipients?: Array<{
    recipient_id: number;
    recipient_type: 'alliance' | 'character' | 'corporation' | 'mailing_list';
  }>;
  subject?: string;
  timestamp?: string;
}

export interface MailLabel {
  color?: 'white' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'gray' | 'brown' | 'pink' | 'purple';
  label_id?: number;
  name?: string;
  unread_count?: number;
}

export interface MailingList {
  mailing_list_id: number;
  name: string;
}

// ==============================
// CONTACTS ENDPOINTS (Medium Priority)
// ==============================

export interface Contact {
  contact_id: number;
  contact_type: 'character' | 'corporation' | 'alliance' | 'faction';
  is_blocked?: boolean;
  is_watched?: boolean;
  label_ids?: number[];
  standing: number;
}

export interface ContactLabel {
  label_id: number;
  label_name: string;
}

// ==============================
// KILLMAILS ENDPOINTS (Medium Priority)
// ==============================

export interface KillmailShort {
  killmail_hash: string;
  killmail_id: number;
}

export interface Killmail {
  attackers: Array<{
    alliance_id?: number;
    character_id?: number;
    corporation_id?: number;
    damage_done: number;
    faction_id?: number;
    final_blow: boolean;
    security_status: number;
    ship_type_id?: number;
    weapon_type_id?: number;
  }>;
  killmail_id: number;
  killmail_time: string;
  moon_id?: number;
  solar_system_id: number;
  victim: {
    alliance_id?: number;
    character_id?: number;
    corporation_id?: number;
    damage_taken: number;
    faction_id?: number;
    items?: Array<{
      flag: number;
      item_type_id: number;
      items?: Array<{
        flag: number;
        item_type_id: number;
        quantity_destroyed?: number;
        quantity_dropped?: number;
        singleton: number;
      }>;
      quantity_destroyed?: number;
      quantity_dropped?: number;
      singleton: number;
    }>;
    position?: {
      x: number;
      y: number;
      z: number;
    };
    ship_type_id: number;
  };
  war_id?: number;
}

// ==============================
// ASSETS ENDPOINTS (Enhanced)
// ==============================

export interface AssetLocation {
  item_id: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface AssetName {
  item_id: number;
  name: string;
}

// ==============================
// PLANETARY INTERACTION ENDPOINTS
// ==============================

export interface Planet {
  last_update: string;
  num_pins: number;
  owner_id: number;
  planet_id: number;
  planet_type: 'temperate' | 'barren' | 'oceanic' | 'ice' | 'gas' | 'lava' | 'storm' | 'plasma';
  solar_system_id: number;
  upgrade_level: number;
}

export interface PlanetDetails {
  links: Array<{
    destination_pin_id: number;
    link_level: number;
    source_pin_id: number;
  }>;
  pins: Array<{
    contents?: Array<{
      amount: number;
      type_id: number;
    }>;
    expiry_time?: string;
    extractor_details?: {
      cycle_time?: number;
      head_radius?: number;
      heads: Array<{
        head_id: number;
        latitude: number;
        longitude: number;
      }>;
      product_type_id?: number;
      qty_per_cycle?: number;
    };
    factory_details?: {
      schematic_id: number;
    };
    install_time?: string;
    last_cycle_start?: string;
    latitude: number;
    longitude: number;
    pin_id: number;
    schematic_id?: number;
    type_id: number;
  }>;
  routes: Array<{
    content_type_id: number;
    destination_pin_id: number;
    quantity: number;
    route_id: number;
    source_pin_id: number;
    waypoints?: number[];
  }>;
}

// ==============================
// FLEET ENDPOINTS
// ==============================

export interface Fleet {
  is_free_move: boolean;
  is_registered: boolean;
  is_voice_enabled: boolean;
  motd: string;
}

export interface FleetMember {
  character_id: number;
  join_time: string;
  role: 'fleet_commander' | 'wing_commander' | 'squad_commander' | 'squad_member';
  role_name: string;
  ship_type_id: number;
  solar_system_id: number;
  squad_id: number;
  station_id?: number;
  takes_fleet_warp: boolean;
  wing_id: number;
}

// ==============================
// ENHANCED SCOPES FOR AUTHENTICATION
// ==============================

export const ESI_SCOPES = {
  // Market & Wallet
  'esi-markets.read_character_orders.v1': 'Read character market orders',
  'esi-markets.read_corporation_orders.v1': 'Read corporation market orders',
  'esi-wallet.read_character_wallet.v1': 'Read character wallet',
  'esi-wallet.read_corporation_wallets.v1': 'Read corporation wallets',
  
  // Industry
  'esi-industry.read_character_jobs.v1': 'Read character industry jobs',
  'esi-industry.read_character_mining.v1': 'Read character mining ledger',
  'esi-industry.read_corporation_jobs.v1': 'Read corporation industry jobs',
  'esi-industry.read_corporation_mining.v1': 'Read corporation mining',
  
  // Contracts
  'esi-contracts.read_character_contracts.v1': 'Read character contracts',
  'esi-contracts.read_corporation_contracts.v1': 'Read corporation contracts',
  
  // Mail
  'esi-mail.read_mail.v1': 'Read character mail',
  'esi-mail.send_mail.v1': 'Send character mail',
  
  // Contacts
  'esi-characters.read_contacts.v1': 'Read character contacts',
  'esi-corporations.read_contacts.v1': 'Read corporation contacts',
  
  // Killmails
  'esi-killmails.read_killmails.v1': 'Read character killmails',
  'esi-killmails.read_corporation_killmails.v1': 'Read corporation killmails',
  
  // Assets
  'esi-assets.read_assets.v1': 'Read character assets',
  'esi-assets.read_corporation_assets.v1': 'Read corporation assets',
  
  // Planetary Interaction
  'esi-planets.manage_planets.v1': 'Manage character planets',
  'esi-planets.read_customs_offices.v1': 'Read corporation customs offices',
  
  // Fleets
  'esi-fleets.read_fleet.v1': 'Read fleet information',
  'esi-fleets.write_fleet.v1': 'Write fleet information',
} as const;

export type EsiScope = keyof typeof ESI_SCOPES;