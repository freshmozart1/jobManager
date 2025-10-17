import { sleep } from './sleep';

// Mock version of runFilterAgent for local testing without hitting external services.
// It simulates filtering logic with adjustable acceptance ratio and optional error injection.
// Usage example:
//   const result = await runFilterAgentMock({
//       acceptRatio: 0.5,
//       errorRate: 0.1,
//       seed: 42
//   });
export async function runFilterAgentMock(options: {
    sampleJobs?: Job[];
    acceptRatio?: number; // 0..1 probability to accept a job
    errorRate?: number;   // 0..1 probability a job evaluation errors
    seed?: number;        // deterministic pseudo-random seed
    artificialDelayMsPerJob?: number; // simulate agent latency per job
} = {}): FilterAgentPromise {
    const {
        sampleJobs = [
            {
                id: 'J-1001', trackingId: 'T-1001', refId: 'R-1001', link: 'https://example.com/jobs/frontend-engineer', title: 'Frontend Engineer', companyName: 'Acme Corp', companyLinkedinUrl: 'https://linkedin.com/company/acme', companyLogo: 'https://example.com/logos/acme.png', companyEmployeesCount: 250, location: 'Remote - US', postedAt: new Date().toISOString(), salaryInfo: ['USD', '$120k-$140k'], salary: '$130k', benefits: ['Health', '401k', 'Flexible Hours'], descriptionHtml: '<p>Build UI components</p>', applicantsCount: 12, applyUrl: 'https://example.com/apply/1001', descriptionText: 'Build UI components', seniorityLevel: 'Mid', employmentType: 'Full-time', jobFunction: 'Engineering', industries: 'Software', inputUrl: 'https://example.com/original/frontend-engineer', companyAddress: { type: 'hq', streetAddress: '1 Main St', addressLocality: 'Springfield', addressRegion: 'IL', postalCode: '62701', addressCountry: 'USA' }, companyWebsite: 'https://acme.example.com', companySlogan: 'Innovation Everyday', companyDescription: 'Acme builds modern web tools.'
            },
            {
                id: 'J-1002', trackingId: 'T-1002', refId: 'R-1002', link: 'https://example.com/jobs/backend-engineer', title: 'Backend Engineer', companyName: 'Beta Systems', companyLinkedinUrl: 'https://linkedin.com/company/betasystems', companyLogo: 'https://example.com/logos/beta.png', companyEmployeesCount: 80, location: 'Berlin, Germany', postedAt: new Date().toISOString(), salaryInfo: ['EUR', '€70k-€85k'], salary: '€80k', benefits: ['Health', 'Stock Options'], descriptionHtml: '<p>Maintain APIs</p>', applicantsCount: 5, applyUrl: 'https://example.com/apply/1002', descriptionText: 'Maintain APIs', seniorityLevel: 'Senior', employmentType: 'Full-time', jobFunction: 'Engineering', industries: 'FinTech', inputUrl: 'https://example.com/original/backend-engineer', companyAddress: { type: 'office', streetAddress: '2 Tech Platz', addressLocality: 'Berlin', addressRegion: 'BE', postalCode: '10115', addressCountry: 'Germany' }, companyWebsite: 'https://beta.example.com', companySlogan: 'Scaling Finance', companyDescription: 'Beta Systems provides financial infrastructure.'
            },
            {
                id: 'J-1003', trackingId: 'T-1003', refId: 'R-1003', link: 'https://example.com/jobs/data-scientist', title: 'Data Scientist', companyName: 'Gamma Analytics', companyLinkedinUrl: 'https://linkedin.com/company/gamma-analytics', companyLogo: 'https://example.com/logos/gamma.png', companyEmployeesCount: 40, location: 'Remote - EU', postedAt: new Date().toISOString(), salaryInfo: ['EUR', '€65k-€75k'], salary: '€70k', benefits: ['Remote Budget', 'Conference Allowance'], descriptionHtml: '<p>Analyze datasets</p>', applicantsCount: 9, applyUrl: 'https://example.com/apply/1003', descriptionText: 'Analyze datasets', seniorityLevel: 'Mid', employmentType: 'Full-time', jobFunction: 'Data', industries: 'Analytics', inputUrl: 'https://example.com/original/data-scientist', companyAddress: { type: 'remote', streetAddress: '', addressLocality: 'Paris', addressRegion: 'IDF', postalCode: '75000', addressCountry: 'France' }, companyWebsite: 'https://gamma.example.com', companySlogan: 'Insights First', companyDescription: 'Gamma delivers analytics solutions.'
            },
            {
                id: 'J-1004', trackingId: 'T-1004', refId: 'R-1004', link: 'https://example.com/jobs/devops-engineer', title: 'DevOps Engineer', companyName: 'Delta Cloud', companyLinkedinUrl: 'https://linkedin.com/company/delta-cloud', companyLogo: 'https://example.com/logos/delta.png', companyEmployeesCount: 120, location: 'Austin, TX', postedAt: new Date().toISOString(), salaryInfo: ['USD', '$110k-$130k'], salary: '$120k', benefits: ['Health', 'Dental', 'Vision'], descriptionHtml: '<p>Manage infrastructure</p>', applicantsCount: 4, applyUrl: 'https://example.com/apply/1004', descriptionText: 'Manage infrastructure', seniorityLevel: 'Mid', employmentType: 'Full-time', jobFunction: 'Engineering', industries: 'Cloud', inputUrl: 'https://example.com/original/devops-engineer', companyAddress: { type: 'hq', streetAddress: '100 Cloud Way', addressLocality: 'Austin', addressRegion: 'TX', postalCode: '73301', addressCountry: 'USA' }, companyWebsite: 'https://delta.example.com', companySlogan: 'Operate at Scale', companyDescription: 'Delta Cloud builds scalable infrastructure tools.'
            },
            {
                id: 'J-1005', trackingId: 'T-1005', refId: 'R-1005', link: 'https://example.com/jobs/product-manager', title: 'Product Manager', companyName: 'Epsilon Products', companyLinkedinUrl: 'https://linkedin.com/company/epsilon-products', companyLogo: 'https://example.com/logos/epsilon.png', companyEmployeesCount: 60, location: 'London, UK', postedAt: new Date().toISOString(), salaryInfo: ['GBP', '£75k-£85k'], salary: '£80k', benefits: ['Pension', 'Learning Budget'], descriptionHtml: '<p>Drive product strategy</p>', applicantsCount: 15, applyUrl: 'https://example.com/apply/1005', descriptionText: 'Drive product strategy', seniorityLevel: 'Senior', employmentType: 'Full-time', jobFunction: 'Product', industries: 'SaaS', inputUrl: 'https://example.com/original/product-manager', companyAddress: { type: 'office', streetAddress: '50 Market St', addressLocality: 'London', addressRegion: 'LDN', postalCode: 'EC2A', addressCountry: 'UK' }, companyWebsite: 'https://epsilon.example.com', companySlogan: 'Value Delivered', companyDescription: 'Epsilon Products creates productivity platforms.'
            }
        ],
        acceptRatio = 0.6,
        errorRate = 0.0,
        seed = Date.now(),
        artificialDelayMsPerJob = 0
    } = options;

    let state = seed >>> 0;
    const rnd = () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0xFFFFFFFF;
    };

    if (!sampleJobs.length) return { jobs: [], rejects: [], errors: [] };

    const accepted: Job[] = [];
    const rejected: Job[] = [];
    const errors: unknown[] = [];

    for (const job of sampleJobs) {
        if (artificialDelayMsPerJob > 0) await sleep(artificialDelayMsPerJob);
        const rollError = rnd();
        if (rollError < errorRate) { errors.push(new Error(`Mock error evaluating job ${job.id}`)); continue; }
        const rollAccept = rnd();
        if (rollAccept < acceptRatio) accepted.push({ ...job }); else rejected.push({ ...job });
    }

    return { jobs: accepted.map(j => ({ ...j })), rejects: rejected, errors };
}
