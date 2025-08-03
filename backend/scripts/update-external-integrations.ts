#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface IntegrationUpdate {
  file: string;
  description: string;
  action: 'update' | 'remove' | 'notify';
}

class ExternalIntegrationUpdater {
  private backendRoot: string;
  private updates: IntegrationUpdate[] = [];

  constructor() {
    this.backendRoot = path.resolve(__dirname, '..');
    this.initializeUpdates();
  }

  private initializeUpdates(): void {
    this.updates = [
      {
        file: path.join(this.backendRoot, 'test-login.js'),
        description: 'Test script using legacy /api/properties endpoint',
        action: 'update'
      },
      {
        file: path.join(this.backendRoot, 'test-properties-app.js'), 
        description: 'Test script using legacy /api/properties endpoint',
        action: 'update'
      },
      {
        file: path.join(this.backendRoot, 'docs', 'image-upload-guide.md'),
        description: 'Documentation referencing legacy endpoints',
        action: 'update'
      },
      {
        file: path.join(this.backendRoot, 'docs', 'inter-service-communication.md'),
        description: 'Inter-service communication docs with legacy endpoints',
        action: 'update'
      }
    ];
  }

  async run(): Promise<void> {
    console.log('🔄 Updating External Integrations');
    console.log('==================================\n');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const update of this.updates) {
      const result = await this.processUpdate(update);
      if (result) updatedCount++;
      else skippedCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated: ${updatedCount} files`);
    console.log(`⏭️  Skipped: ${skippedCount} files`);
    
    console.log('\n📋 Manual Review Required:');
    console.log('- Check any external services calling your API');
    console.log('- Update mobile app configurations');
    console.log('- Notify third-party integrators');
    console.log('- Update API documentation');
    
    console.log('\n✅ External integration updates completed!');
  }

  private async processUpdate(update: IntegrationUpdate): Promise<boolean> {
    console.log(`📁 Processing: ${path.basename(update.file)}`);
    console.log(`   Description: ${update.description}`);

    if (!fs.existsSync(update.file)) {
      console.log(`   ⚠️  File not found, skipping...`);
      return false;
    }

    switch (update.action) {
      case 'update':
        return await this.updateFile(update.file);
      case 'remove':
        return await this.removeFile(update.file);
      case 'notify':
        console.log(`   📢 Manual update required`);
        return false;
    }
  }

  private async updateFile(filePath: string): Promise<boolean> {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      // Update API endpoints
      const replacements = [
        { from: /\/api\/properties(?!\/)/g, to: '/api/rentals' },
        { from: /\/api\/units(?!\/)/g, to: '/api/rentals' },
        { from: /\/api\/listings(?!\/)/g, to: '/api/rentals' }
      ];

      for (const replacement of replacements) {
        if (replacement.from.test(content)) {
          content = content.replace(replacement.from, replacement.to);
          updated = true;
        }
      }

      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`   ✅ Updated API endpoints`);
        return true;
      } else {
        console.log(`   ℹ️  Already up to date`);
        return false;
      }

    } catch (error) {
      console.log(`   ❌ Failed to update: ${error}`);
      return false;
    }
  }

  private async removeFile(filePath: string): Promise<boolean> {
    try {
      fs.unlinkSync(filePath);
      console.log(`   🗑️  Removed file`);
      return true;
    } catch (error) {
      console.log(`   ❌ Failed to remove: ${error}`);
      return false;
    }
  }
}

// Main execution
async function main() {
  const updater = new ExternalIntegrationUpdater();
  await updater.run();
}

if (require.main === module) {
  main().catch(console.error);
}