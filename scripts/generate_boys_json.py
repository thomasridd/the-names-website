#!/usr/bin/env python3
"""
Generate boys.json from CSV data files.

Combines data from:
- Boys-from-1996.csv: Rank and count data from 1996-2024
- Boys-Historic-Top-100.csv: Historic top 100 rankings from 1904-2024

Output format matches example.json structure.
"""

import csv
import json
from pathlib import Path


def read_boys_from_1996(csv_path):
    """
    Read Boys-from-1996.csv and extract name data.

    Returns a dict with name as key and data dict as value:
    {
        "name": {
            "rank": 2024_rank,
            "count": 2024_count,
            "rankFrom1996": [1996_rank, ..., 2024_rank],
            "countFrom1996": [1996_count, ..., 2024_count]
        }
    }
    """
    names_data = {}

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            name = row['Name']

            # Extract 2024 data
            rank_2024 = int(row['2024 Rank']) if row['2024 Rank'] and row['2024 Rank'] != '[x]' else None
            count_2024 = int(row['2024 Count'].replace(',', '')) if row['2024 Count'] and row['2024 Count'] != '[x]' else None

            # Build rank and count arrays from 1996 to 2024
            rank_from_1996 = []
            count_from_1996 = []

            # Years from 1996 to 2024 (29 years)
            for year in range(1996, 2025):
                year_str = str(year)
                rank_key = f'{year_str} Rank'
                count_key = f'{year_str} Count'

                # Get rank value
                rank_val = row.get(rank_key, '')
                if not rank_val or rank_val == '[x]':
                    rank_from_1996.append('x')
                else:
                    rank_from_1996.append(rank_val.replace(',', ''))

                # Get count value
                count_val = row.get(count_key, '')
                if not count_val or count_val == '[x]':
                    count_from_1996.append('x')
                else:
                    count_from_1996.append(count_val.replace(',', ''))

            names_data[name] = {
                'name': name,
                'rank': rank_2024,
                'count': count_2024,
                'rankFrom1996': rank_from_1996,
                'countFrom1996': count_from_1996
            }

    return names_data


def read_boys_historic_top_100(csv_path):
    """
    Read Boys-Historic-Top-100.csv and extract historic rankings.

    Returns a dict with name as key and historic rank array as value:
    {
        "name": [1904_rank, 1914_rank, ..., 2024_rank]
    }
    """
    historic_data = {}

    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        # Get year columns (all columns except 'Rank')
        year_columns = [col for col in reader.fieldnames if col != 'Rank']

        for row in reader:
            rank_position = row['Rank']

            # For each year, get the name at this rank position
            for year_col in year_columns:
                name = row[year_col].strip()

                if name:
                    if name not in historic_data:
                        # Initialize with 'x' for all years
                        historic_data[name] = ['x'] * len(year_columns)

                    # Set the rank for this year
                    year_index = year_columns.index(year_col)
                    historic_data[name][year_index] = rank_position

    return historic_data


def merge_data(names_data, historic_data):
    """
    Merge the two data sources.

    Adds rankHistoric array to each name in names_data.
    """
    for name, data in names_data.items():
        # Add historic ranking data if available
        if name in historic_data:
            data['rankHistoric'] = historic_data[name]
        else:
            # If name not in historic data, create array of 'x' values
            # Historic data has 13 years: 1904, 1914, 1924, ..., 2024
            data['rankHistoric'] = ['x'] * 13

    return names_data


def main():
    # Set up paths
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'data'

    boys_1996_path = data_dir / 'Boys-from-1996.csv'
    boys_historic_path = data_dir / 'Boys-Historic-Top-100.csv'
    output_path = data_dir / 'boys.json'

    print(f"Reading {boys_1996_path}...")
    names_data = read_boys_from_1996(boys_1996_path)
    print(f"  Found {len(names_data)} names")

    print(f"Reading {boys_historic_path}...")
    historic_data = read_boys_historic_top_100(boys_historic_path)
    print(f"  Found {len(historic_data)} unique names in historic data")

    print("Merging data...")
    merged_data = merge_data(names_data, historic_data)

    # Convert to list for JSON output
    output_list = list(merged_data.values())

    # Sort by 2024 rank (names with rank first, then alphabetically)
    output_list.sort(key=lambda x: (x['rank'] is None, x['rank'] if x['rank'] else 0, x['name']))

    print(f"Writing to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_list, f, indent=2, ensure_ascii=False)

    print(f"✓ Successfully generated {output_path}")
    print(f"  Total names: {len(output_list)}")
    print(f"  Names with 2024 rank: {sum(1 for n in output_list if n['rank'] is not None)}")
    print(f"  Names with historic data: {sum(1 for n in output_list if any(r != 'x' for r in n['rankHistoric']))}")


if __name__ == '__main__':
    main()
