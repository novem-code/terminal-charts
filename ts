#!/usr/bin/env python
# -*- coding: utf-8; mode: python -*-

import argparse
import datetime as dt
import pandas as pd
import yfinance as yfin
import numpy as np
from tabulate import tabulate
from pandas_datareader import data as pdr

yfin.pdr_override()

def get_date_range(args):
    today = dt.datetime.today().date()

    def get_md(m):
      mx = 30
      if m in [1,3,5,7,9,11]:
          mx = 31
      if m == 2:
          mx = 28

      return mx
    
    if args.range:
        if args.range.lower() == 'mtd':
            start = dt.date(today.year, today.month, 1)
        elif args.range.lower() == 'ytd':
            start = dt.date(today.year, 1, 1)
        elif args.range.lower() == 'wtd':
            start = today - dt.timedelta(days=today.weekday())
        elif args.range.lower() == 'qtd':
            quarter = (today.month - 1) // 3 + 1
            start_month = (quarter - 1) * 3 + 1
            start = dt.date(today.year, start_month, 1)
        elif args.range.lower() == '3m':
            mx = get_md(today.month - 3)
            start = dt.date(today.year , today.month - 3, min(today.day, mx))
        elif args.range.lower() == '6m':
            mx = get_md(today.month - 6)
            start = dt.date(today.year , today.month - 6, min(today.day, mx))
        elif args.range.lower() == '1y':
            start = dt.date(today.year - 1, today.month, today.day)
        elif args.range.lower() == '2y':
            start = dt.date(today.year - 2, today.month, today.day)
        elif args.range.lower() == '3y':
            start = dt.date(today.year - 3, today.month, today.day)
        elif args.range.lower() == '5y':
            start = dt.date(today.year - 5, today.month, today.day)
        elif args.range.lower() == '10y':
            start = dt.date(today.year - 10, today.month, today.day)

        else:
            raise ValueError(f"Unsupported range value: {args.range}")
        end = today
    else:
        start = args.start or dt.date(today.year, 1, 1) # default to ytd
        end = args.end or today

    return start, end

def rebase_series(df, base_index):
    df = np.log(df.pct_change()+1)
    df.iloc[0] = 0

    if base_index == 0 :
      df = (np.exp(df.cumsum())*1.0)-1
    else:
      df = np.exp(df.cumsum())*base_index


    return df

def main():
    parser = argparse.ArgumentParser(description="Fetch stock data from Yahoo Finance.")
    parser.add_argument("-s", "--start", type=str, help="Start date in the format YYYY-MM-DD.")
    parser.add_argument("-e", "--end", type=str, help="End date in the format YYYY-MM-DD.")
    parser.add_argument("-r", "--range", type=str, help="Date range options: mtd, ytd, wtd, qtd.")
    parser.add_argument("-i", "--index", nargs="?", const=100, type=float, help="Rebase stock series to an index. Optional starting index.")
    parser.add_argument("tickers", nargs="+", type=str, help="List of ticker codes.")
    args = parser.parse_args()

    start_date, end_date = get_date_range(args)

    # fix tickers
    tickers = list(args.tickers)

    #print(f'{start_date} => {end_date} for {tickers}')

    df = pdr.get_data_yahoo(args.tickers, start=start_date, end=end_date, progress=False)['Adj Close']

    # TODO: If series make dataframe
    #print(df)

    # format output
    df.index = df.index.strftime('%Y-%m-%d')

    # align with ticker order
    df = df[tickers]

    # drop na (ccys are traded on weekends)
    df = df.dropna()


    if args.index is not None:
      df = rebase_series(df, args.index)


    disp = tabulate(df, headers='keys', tablefmt='simple', floatfmt=',.2f')


    print(disp)

    return df



if __name__ == "__main__":
    df = main()

