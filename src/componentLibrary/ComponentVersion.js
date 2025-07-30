/**
 * ComponentVersion - Semantic versioning for components
 */
export class ComponentVersion {
    constructor(versionString = '1.0.0') {
        if (typeof versionString === 'string') {
            this.parseVersion(versionString);
        } else if (typeof versionString === 'object') {
            this.major = versionString.major || 1;
            this.minor = versionString.minor || 0;
            this.patch = versionString.patch || 0;
            this.prerelease = versionString.prerelease || '';
            this.metadata = versionString.metadata || '';
        } else {
            this.major = 1;
            this.minor = 0;
            this.patch = 0;
            this.prerelease = '';
            this.metadata = '';
        }
        
        this.history = [];
        this.changelog = [];
    }

    // Parse version string (e.g., "1.2.3-beta.1+build.123")
    parseVersion(versionString) {
        const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
        const match = versionString.match(regex);
        
        if (!match) {
            throw new Error(`Invalid version string: ${versionString}`);
        }
        
        this.major = parseInt(match[1], 10);
        this.minor = parseInt(match[2], 10);
        this.patch = parseInt(match[3], 10);
        this.prerelease = match[4] || '';
        this.metadata = match[5] || '';
    }

    // Convert to string
    toString() {
        let version = `${this.major}.${this.minor}.${this.patch}`;
        
        if (this.prerelease) {
            version += `-${this.prerelease}`;
        }
        
        if (this.metadata) {
            version += `+${this.metadata}`;
        }
        
        return version;
    }

    // Increment version
    increment(type = 'patch', prerelease = '') {
        // Store current version in history
        this.addToHistory({
            version: this.toString(),
            timestamp: Date.now(),
            type: type
        });
        
        switch (type) {
            case 'major':
                this.major++;
                this.minor = 0;
                this.patch = 0;
                this.prerelease = prerelease;
                break;
                
            case 'minor':
                this.minor++;
                this.patch = 0;
                this.prerelease = prerelease;
                break;
                
            case 'patch':
                this.patch++;
                this.prerelease = prerelease;
                break;
                
            case 'prerelease':
                if (this.prerelease) {
                    // Increment existing prerelease
                    const parts = this.prerelease.split('.');
                    const lastPart = parts[parts.length - 1];
                    const num = parseInt(lastPart, 10);
                    
                    if (!isNaN(num)) {
                        parts[parts.length - 1] = (num + 1).toString();
                        this.prerelease = parts.join('.');
                    } else {
                        this.prerelease = prerelease || `${this.prerelease}.1`;
                    }
                } else {
                    this.prerelease = prerelease || 'alpha.1';
                }
                break;
                
            default:
                throw new Error(`Invalid increment type: ${type}`);
        }
        
        return this.toString();
    }

    // Compare with another version
    compare(other) {
        if (!(other instanceof ComponentVersion)) {
            other = new ComponentVersion(other);
        }
        
        // Compare major
        if (this.major !== other.major) {
            return this.major - other.major;
        }
        
        // Compare minor
        if (this.minor !== other.minor) {
            return this.minor - other.minor;
        }
        
        // Compare patch
        if (this.patch !== other.patch) {
            return this.patch - other.patch;
        }
        
        // Compare prerelease
        if (this.prerelease && !other.prerelease) {
            return -1; // This version is prerelease, other is not
        }
        if (!this.prerelease && other.prerelease) {
            return 1; // Other version is prerelease, this is not
        }
        if (this.prerelease && other.prerelease) {
            return this.comparePrerelease(this.prerelease, other.prerelease);
        }
        
        return 0; // Versions are equal
    }

    // Compare prerelease versions
    comparePrerelease(pre1, pre2) {
        const parts1 = pre1.split('.');
        const parts2 = pre2.split('.');
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i];
            const part2 = parts2[i];
            
            // Missing parts come before existing parts
            if (part1 === undefined) return -1;
            if (part2 === undefined) return 1;
            
            // Numeric comparison
            const num1 = parseInt(part1, 10);
            const num2 = parseInt(part2, 10);
            
            if (!isNaN(num1) && !isNaN(num2)) {
                if (num1 !== num2) return num1 - num2;
            } else if (!isNaN(num1)) {
                return -1; // Numbers come before strings
            } else if (!isNaN(num2)) {
                return 1; // Numbers come before strings
            } else {
                // String comparison
                const cmp = part1.localeCompare(part2);
                if (cmp !== 0) return cmp;
            }
        }
        
        return 0;
    }

    // Check if version satisfies a range
    satisfies(range) {
        // Simple implementation - can be extended for complex ranges
        if (range === '*' || range === 'latest') return true;
        
        // Handle caret ranges (^1.2.3)
        if (range.startsWith('^')) {
            const baseVersion = new ComponentVersion(range.substring(1));
            if (this.major !== baseVersion.major) return false;
            if (this.major === 0 && this.minor !== baseVersion.minor) return false;
            return this.compare(baseVersion) >= 0;
        }
        
        // Handle tilde ranges (~1.2.3)
        if (range.startsWith('~')) {
            const baseVersion = new ComponentVersion(range.substring(1));
            if (this.major !== baseVersion.major) return false;
            if (this.minor !== baseVersion.minor) return false;
            return this.patch >= baseVersion.patch;
        }
        
        // Handle exact match
        return this.toString() === range;
    }

    // Check if this version is greater than another
    isGreaterThan(other) {
        return this.compare(other) > 0;
    }

    // Check if this version is less than another
    isLessThan(other) {
        return this.compare(other) < 0;
    }

    // Check if this version equals another
    equals(other) {
        return this.compare(other) === 0;
    }

    // Check if this is a prerelease version
    isPrerelease() {
        return !!this.prerelease;
    }

    // Check if this is a stable version
    isStable() {
        return !this.prerelease && this.major > 0;
    }

    // Add to version history
    addToHistory(entry) {
        this.history.push(entry);
        
        // Keep only last 50 entries
        if (this.history.length > 50) {
            this.history.shift();
        }
    }

    // Add changelog entry
    addChangelogEntry(entry) {
        this.changelog.push({
            version: this.toString(),
            timestamp: Date.now(),
            ...entry
        });
    }

    // Get changelog for a specific version range
    getChangelog(fromVersion = null, toVersion = null) {
        let entries = this.changelog;
        
        if (fromVersion) {
            const from = new ComponentVersion(fromVersion);
            entries = entries.filter(entry => {
                const v = new ComponentVersion(entry.version);
                return v.isGreaterThan(from) || v.equals(from);
            });
        }
        
        if (toVersion) {
            const to = new ComponentVersion(toVersion);
            entries = entries.filter(entry => {
                const v = new ComponentVersion(entry.version);
                return v.isLessThan(to) || v.equals(to);
            });
        }
        
        return entries.sort((a, b) => {
            const va = new ComponentVersion(a.version);
            const vb = new ComponentVersion(b.version);
            return vb.compare(va); // Sort descending
        });
    }

    // Clone version
    clone() {
        const cloned = new ComponentVersion(this.toString());
        cloned.history = [...this.history];
        cloned.changelog = [...this.changelog];
        return cloned;
    }

    // Convert to JSON
    toJSON() {
        return {
            major: this.major,
            minor: this.minor,
            patch: this.patch,
            prerelease: this.prerelease,
            metadata: this.metadata,
            history: this.history,
            changelog: this.changelog
        };
    }

    // Create from JSON
    static fromJSON(data) {
        const version = new ComponentVersion(data);
        if (data.history) version.history = data.history;
        if (data.changelog) version.changelog = data.changelog;
        return version;
    }
}