export type PriceBadge = 'below_market' | 'fair' | 'above_market';
export type MileageBadge = 'low' | 'average' | 'high';
export type SellerType = 'private' | 'dealer';
export type Condition = 'new' | 'excellent' | 'good' | 'fair' | 'salvage';
export type Transmission = 'automatic' | 'manual' | 'cvt';
export type Drivetrain = 'fwd' | 'rwd' | 'awd' | '4wd';

export interface Seller {
	username: string;
	feedbackScore: number;
	feedbackPercent: number;
	location: string;
	memberSince: string;
	type: SellerType;
}

export interface Listing {
	id: string;
	title: string;
	year: number;
	make: string;
	model: string;
	trim: string;
	price: number;
	marketAverage: number;
	priceBadge: PriceBadge;
	mileage: number;
	mileageBadge: MileageBadge;
	condition: Condition;
	transmission: Transmission;
	drivetrain: Drivetrain;
	color: string;
	vin: string;
	description: string;
	photos: string[];
	location: string;
	seller: Seller;
	watcherCount: number;
	saveCount: number;
	listedAt: string;
}
