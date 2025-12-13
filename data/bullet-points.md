# Bullet Points Generation Guide

This document explains how to generate the four bullet points that appear on each name page.

## Overview

Each name page displays 4 bullet points that summarize:
1. Current status (2024 ranking)
2. Recent trend (past 5 years)
3. 20-year trend pattern
4. Historic pattern (100+ years)

---

## Point 1: Current Status

**Purpose:** Show the name's current popularity in 2024

**Template:**
```
In 2024 {count} {gender} babies were named {name} making it the {rank} most popular {gender}'s name
```

**Data Sources:**
- `count` - From name data (2024 count)
- `gender` - "boy" or "girl" from name data
- `name` - The name itself
- `rank` - Current rank in 2024

**Example:**
```
In 2024 5,721 boy babies were named Muhammad making it the 1 most popular boy's name
```

---

## Point 2: Recent Trend (Past 5 Years)

**Purpose:** Describe the trend over the last 5 years

**Templates:**

**For rare names (2+ missing data points):**
```
{name} is a very rare name and in recent years has been missing from the statistics
```

**For normal names:**
```
{name} is currently {gaining, losing, maintaining} popularity
```

**Data Sources:**
- Use the **last 5 values** from `countFrom1996` time series (indices 24-28, years 2020-2024)
- Check for missing data (values marked as 'x')

**Algorithm:**

1. **Check for Missing Data:**
   - Count how many of the last 5 years have 'x' values
   - If 2 or more are missing → use "very rare name" template
   - Otherwise → proceed to regression analysis

2. **Linear Regression Analysis:**
   - Convert valid data points to (x, y) coordinates where:
     - x = year index (0-4)
     - y = count value (number of babies given the name)
   - Calculate slope and r-squared using linear regression
   - Remember: **positive slope = gaining popularity** (more babies per year)
   - Remember: **negative slope = losing popularity** (fewer babies per year)

3. **Trend Classification:**
   - **Low confidence (r² < 0.3):** → "maintaining" (no clear trend)
   - **Strong upward slope (slope > 50) + good fit:** → "gaining" (50+ more babies per year)
   - **Strong downward slope (slope < -50) + good fit:** → "losing" (50+ fewer babies per year)
   - **Small slope (|slope| ≤ 50):** → "maintaining"

**Implementation Notes:**
- Uses least squares linear regression on baby counts (not ranks)
- R-squared measures how well the trend fits the data
- Slope represents change in number of babies per year
- Slope thresholds (±50) can be adjusted based on testing
- Higher r-squared (closer to 1.0) = more confident in the trend
- Lower r-squared (closer to 0) = more volatile/no clear pattern

---

## Point 3: 20-Year Trend Pattern

**Purpose:** Identify the dominant pattern over the past 20 years

**Data Sources:**
- Use `rankFrom1996` time series (1996-2024, 29 years)
- Focus on the most recent 20 years for analysis

**Template:**
```
Over the past 20 years {name} [pattern description]
```

### Pattern Options

Choose the **most appropriate** option based on the ranking data:

#### Option 1: Steady Ranking
```
has maintained a steady ranking between {min} in {min_year} to {max} in {max_year}
```
- **When to use:** Low variance in rankings
- **Variables:** min rank, max rank, years they occurred

#### Option 2: Erratic
```
has jumped around erratically between {min} in {min_year} to {max} in {max_year}
```
- **When to use:** High variance with no clear trend
- **Variables:** min rank, max rank, years they occurred

#### Option 3: Steady Gain
```
has steadily gained popularity from {min} in {min_year} to {max} in {max_year}
```
- **When to use:** Clear upward trend (rank improving/decreasing)
- **Variables:** Starting rank (min), ending rank (max), respective years

#### Option 4: Steady Decline
```
has steadily declined in popularity from {max} in {max_year} to {min} in {min_year}
```
- **When to use:** Clear downward trend (rank worsening/increasing)
- **Variables:** Peak rank (max), current low rank (min), respective years

#### Option 5: Peak and Fade
```
gained in popularity to {max} in {max_year} but has since declined in popularity to {min} in {min_year}
```
- **When to use:** Rose to a peak, then declined
- **Variables:** Peak rank, peak year, current rank, current year

#### Option 6: Recovery
```
dropped in popularity to {min} in {min_year} but has since regained popularity to {max} in {max_year}
```
- **When to use:** Hit a low point, then recovered
- **Variables:** Low rank, low year, recovery rank, recovery year
- **Note:** Template shows "to {min}" twice - second should likely be {max}

#### Option 7: Cyclical
```
has cycled in and out of fashion achieving a peak of {max} in {max_year} and a low of {min} in {min_year}
```
- **When to use:** Multiple peaks and valleys with cyclical pattern
- **Variables:** Best rank, worst rank, respective years

---

## Point 4: Historic Pattern (100+ Years)

**Purpose:** Describe the name's popularity over the past century

**Data Sources:**
- Use `rankHistoric` time series (13 decades: 1910s-2020s)
- Values are top 100 ranks or "x" (not in top 100)

**Template:**
```
Historically {name} [pattern description]
```

### Pattern Options

Choose the **most appropriate** option based on historic ranking data:

#### Option 1: Never Top 100
```
has never made it to the top 100 lists
```
- **When to use:** All values in `rankHistoric` are "x"

#### Option 2: Rare Appearances
```
has only made it to the top 100 list {n} time{s} in the {list of decades}
```
- **When to use:** n < 3 appearances AND no more than 2 consecutive decades
- **Variables:**
  - `n` - Number of times in top 100
  - `s` - Plural suffix ("" or "s")
  - `list of decades` - e.g., "1950s and 1970s"

#### Option 3: Mid-Century Period
```
made it to the top 100 names for boys between {decade_one} and {decade_two} peaking in {decade_max}
```
- **When to use:**
  - Total time in top 100 < 50 years
  - decade_one > 1910s
  - decade_two < 2010s
- **Variables:** First decade, last decade, peak decade

#### Option 4: Early 20th Century Peak
```
was most popular in the early 20th century ({max} in the {max_decade}) but hasn't ranked in the top 100 since {last_decade}
```
- **When to use:** Peak in early decades (1910s-1940s), last appearance ≤ 2000
- **Variables:** Best rank, decade of best rank, last decade in top 100

#### Option 5: Mid 20th Century Peak
```
was popular in the mid 20th century ({max} in the {max_decade}) but hasn't ranked in the top 100 since {last_decade}
```
- **When to use:** Peak in mid decades (1940s-1970s), last appearance ≤ 2000
- **Variables:** Best rank, decade of best rank, last decade in top 100

#### Option 6: Late 20th Century Peak
```
was popular in the late 20th century ({max} in the {max_decade}) but hasn't ranked in the top 100 since {last_decade}
```
- **When to use:** Peak in late decades (1970s-1990s), last appearance ≤ 2000
- **Variables:** Best rank, decade of best rank, last decade in top 100

#### Option 7: Modern Name
```
is a modern name and didn't rank in the top 100 until {first_decade}
```
- **When to use:** First top 100 appearance in 1990s or later
- **Variables:** First decade in top 100

#### Option 8: Revival
```
was very popular in the early 20th century ({max} in the {max_decade}), dropped out of the top 100 for {time_not_in_top_100} years, but has revived and is now ranked {2024_rank}
```
- **When to use:**
  - Peak in early 20th century
  - Out of top 100 for ≥ 30 years
  - 2024 rank < 100
- **Variables:** Best rank, best decade, years absent, current rank

#### Option 9: Timeless Classic
```
has always been a popular name and has never dropped out of the top 100 names
```
- **When to use:** No "x" values in `rankHistoric` - appeared in top 100 every decade

---

## Implementation Guidelines

### Data Processing Scripts

The bullet points are generated by scripts in the `scripts/` directory:

- `scripts/add-bullet-point-1.js` - Generates Point 1 (current status)
- `scripts/add-bullet-point-2.js` - Generates Point 2 (5-year trend)
- `scripts/add-bullet-point-3.js` - Generates Point 3 (20-year pattern)
- `scripts/add-bullet-point-4.js` - Generates Point 4 (historic pattern)
- `scripts/add-all-bullet-points.js` - Runs all bullet point scripts

### Pattern Selection Logic

Each script should:
1. Read the name data (boys.json or girls.json)
2. Analyze the relevant time series data
3. Apply pattern matching logic to select the best option
4. Populate the template with calculated values
5. Add the `bulletPoint{N}` property to each name object
6. Write the updated data back to the file

### Variable Formatting

- **Years:** Use format like "2020" or "the 2020s" for decades
- **Ranks:** Use ordinal format ("1st", "2nd", "3rd", etc.) where appropriate
- **Gender:** Use lowercase "boy" or "girl"
- **Counts:** Use comma-separated format for large numbers (e.g., "5,721")

### Quality Checks

- Ensure calculated values are accurate
- Verify grammatical correctness of generated sentences
- Handle edge cases (missing data, unranked years marked as "x")
- Test with a variety of name patterns to ensure all options are reachable

---

## Display in Templates

Bullet points are displayed in `src/name-pages.njk`:

```html
<ul>
  <li>{{ nameData.bulletPoint1 }}</li>
  <li>{{ nameData.bulletPoint2 }}</li>
  <li>{{ nameData.bulletPoint3 }}</li>
  <li>{{ nameData.bulletPoint4 }}</li>
</ul>
```

Each bullet point is stored as a complete sentence in the name data object.
