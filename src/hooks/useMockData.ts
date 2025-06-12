
import { useState, useEffect } from 'react';
import { Bid, BidEntry } from '../types';

export const useMockBids = () => {
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    const mockBids: Bid[] = [
      {
        id: '1',
        lotName: 'Plastic Waste Lot A1',
        description: 'Mixed plastic waste - 50 tons',
        wasteType: 'Plastic',
        quantity: 50,
        unit: 'tons',
        startDate: '2024-06-06T08:00:00Z',
        endDate: '2024-06-06T18:00:00Z',
        basePrice: 1500,
        currentPrice: 2100,
        status: 'in-progress',
        createdBy: '1',
        location: 'Chicago, IL',
        bids: [
          { id: '1', bidId: '1', bidderId: '2', bidderName: 'EcoRecycle Ltd.', amount: 2100, timestamp: '2024-06-06T14:30:00Z', rank: 1 },
          { id: '2', bidId: '1', bidderId: '3', bidderName: 'Waste Aggregators Co.', amount: 2000, timestamp: '2024-06-06T14:25:00Z', rank: 2 },
        ]
      },
      {
        id: '2',
        lotName: 'Electronic Waste E-001',
        description: 'Computer equipment and accessories',
        wasteType: 'E-Waste',
        quantity: 25,
        unit: 'tons',
        startDate: '2024-06-06T09:00:00Z',
        endDate: '2024-06-06T17:00:00Z',
        basePrice: 3000,
        currentPrice: 4200,
        status: 'in-progress',
        createdBy: '1',
        location: 'New York, NY',
        bids: [
          { id: '3', bidId: '2', bidderId: '2', bidderName: 'EcoRecycle Ltd.', amount: 4200, timestamp: '2024-06-06T15:10:00Z', rank: 1 },
        ]
      },
      {
        id: '3',
        lotName: 'Paper Waste P-205',
        description: 'Office paper and cardboard',
        wasteType: 'Paper',
        quantity: 75,
        unit: 'tons',
        startDate: '2024-06-05T08:00:00Z',
        endDate: '2024-06-05T18:00:00Z',
        basePrice: 800,
        currentPrice: 1250,
        status: 'closed',
        createdBy: '1',
        location: 'Los Angeles, CA',
        bids: [
          { id: '4', bidId: '3', bidderId: '3', bidderName: 'Waste Aggregators Co.', amount: 1250, timestamp: '2024-06-05T17:45:00Z', rank: 1 },
          { id: '5', bidId: '3', bidderId: '2', bidderName: 'EcoRecycle Ltd.', amount: 1200, timestamp: '2024-06-05T17:30:00Z', rank: 2 },
        ]
      },
      {
        id: '4',
        lotName: 'Metal Scrap M-150',
        description: 'Mixed metal scrap',
        wasteType: 'Metal',
        quantity: 100,
        unit: 'tons',
        startDate: '2024-06-04T08:00:00Z',
        endDate: '2024-06-04T18:00:00Z',
        basePrice: 5000,
        currentPrice: 6800,
        status: 'closed',
        createdBy: '1',
        location: 'Houston, TX',
        bids: [
          { id: '6', bidId: '4', bidderId: '2', bidderName: 'EcoRecycle Ltd.', amount: 6800, timestamp: '2024-06-04T17:55:00Z', rank: 1 },
          { id: '7', bidId: '4', bidderId: '3', bidderName: 'Waste Aggregators Co.', amount: 6500, timestamp: '2024-06-04T17:40:00Z', rank: 2 },
        ]
      }
    ];
    
    setBids(mockBids);
  }, []);

  return { bids, setBids };
};

export const useCountdown = (endDate: string) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('00:00:00');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
};
