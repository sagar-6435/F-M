import { Phone, Mail, MapPin, ShieldAlert, Clock3, MessageCircle } from "lucide-react";

const maintenanceContacts = [
	{
		label: "Branch Support",
		phone: "+91 99127 10932",
		whatsapp: "https://wa.me/919912710932",
	},
	{
		label: "Admin Desk",
		phone: "+91 76800 06662",
		whatsapp: "https://wa.me/917680006662",
	},
];

const Maintanace = () => {
	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_35%),linear-gradient(180deg,_#0f172a_0%,_#111827_45%,_#0b1020_100%)] px-4 py-16 text-white">
			<div className="mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
				<div className="w-full rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
					<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
						<ShieldAlert className="h-4 w-4" /> Under Maintenance
					</div>

					<div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
						<div>
							<p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-amber-200/80">Friends & Memories</p>
							<h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
								This website is currently under maintenance.
							</h1>
							<p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
								We are working on updates to improve your experience. Some pages and booking features may be temporarily unavailable while maintenance is in progress.
							</p>

							<div className="mt-8 grid gap-4 sm:grid-cols-2">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="mb-3 flex items-center gap-2 text-amber-200">
										<Clock3 className="h-4 w-4" />
										<span className="text-xs font-bold uppercase tracking-[0.25em]">Status</span>
									</div>
									<p className="text-sm text-slate-200">Maintenance mode is active. Please check back soon.</p>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="mb-3 flex items-center gap-2 text-amber-200">
										<Mail className="h-4 w-4" />
										<span className="text-xs font-bold uppercase tracking-[0.25em]">Email</span>
									</div>
									<a href="mailto:info@friendsandmemories.in" className="text-sm text-slate-200 transition-colors hover:text-amber-200">
										info@friendsandmemories.in
									</a>
								</div>
							</div>
						</div>

						<div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 sm:p-6">
							<h2 className="font-display text-2xl font-bold text-white">Contact Admins</h2>
							<p className="mt-2 text-sm leading-7 text-slate-300">
								If you need immediate assistance, please reach out to the admin team using the numbers below.
							</p>

							<div className="mt-6 space-y-4">
								{maintenanceContacts.map((contact) => (
									<div key={contact.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
										<p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">{contact.label}</p>
										<a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="mt-3 flex items-center gap-3 text-sm text-slate-100 transition-colors hover:text-amber-200">
											<Phone className="h-4 w-4" />
											<span>{contact.phone}</span>
										</a>
										<a href={contact.whatsapp} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-3 text-sm text-slate-100 transition-colors hover:text-[#25D366]">
											<MessageCircle className="h-4 w-4" />
											<span>Message on WhatsApp</span>
										</a>
									</div>
								))}
							</div>

							<div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
								<div className="flex items-start gap-3">
									<MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
									<p className="text-sm leading-7 text-slate-200">
										Visit the branch only after confirmation from the admin team.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Maintanace;
