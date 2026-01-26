// reporters/html-comment-reporter.ts
import fs from 'fs';
import path from 'path';
import type { Reporter, FullResult } from '@playwright/test/reporter';

class HtmlCommentReporter implements Reporter {
    onEnd(result: FullResult) {
        const reportDir = 'playwright-report';
        const indexPath = path.join(reportDir, 'index.html');

        if (!fs.existsSync(indexPath)) return;

        const comment = '<!-- htmlhint-disable -->\n';
        const html = fs.readFileSync(indexPath, 'utf-8');

        if (html.startsWith(comment)) return;

        fs.writeFileSync(indexPath, comment + html, 'utf-8');
    }
}

export default HtmlCommentReporter;
